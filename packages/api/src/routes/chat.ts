import { Router, type Request, type Response } from "express"
import { db } from "db"
import { bots, conversations, messages, tickets } from "db/schema"
import { eq, and, asc, desc } from "drizzle-orm"
import { validate } from "../middleware/validate"
import { chatRateLimiter } from "../middleware/rate-limit"
import { embedText, streamText } from "@botly/ai"
import { inngest } from "@botly/inngest"
import { findRelevantChunks, buildRagPrompt, type RelevantChunk } from "../lib/rag"
import { logger } from "../lib/logger"
import {
  registerVisitorStream,
  pushToVisitor,
  broadcastToConversation,
  broadcastToOrg,
} from "../lib/realtime"
import {
  BotIdParamSchema,
  ConvoIdParamSchema,
  StartConversationSchema,
  SendChatMessageSchema,
  HandoffRequestSchema,
  DEFAULT_WIDGET_CONFIG,
  type WidgetConfig,
  type BotPublicConfig,
  type Conversation,
  type Message,
} from "types"

import cors from "cors"

export const chatRouter = Router({ mergeParams: true })

// Public widget routes allow embedding and interaction from any host website
chatRouter.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
)

// Apply rate limiter to all chat routes
chatRouter.use(chatRateLimiter)

/**
 * GET /api/chat/:botId/config
 * Public endpoint returning widget configuration for widget rendering
 */
chatRouter.get(
  "/:botId/config",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)

    const [bot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        widgetTheme: bots.widgetTheme,
      })
      .from(bots)
      .where(eq(bots.id, botId))
      .limit(1)

    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found",
      })
      return
    }

    const publicConfig: BotPublicConfig = {
      id: bot.id,
      name: bot.name,
      widgetConfig: (bot.widgetTheme as WidgetConfig | null) ?? DEFAULT_WIDGET_CONFIG,
    }

    res.json(publicConfig)
  }
)

/**
 * POST /api/chat/:botId/conversations
 * Start a new conversation for a visitor
 */
chatRouter.post(
  "/:botId/conversations",
  validate({ params: BotIdParamSchema, body: StartConversationSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const { visitorId } = req.body

    const [bot] = await db
      .select({ id: bots.id })
      .from(bots)
      .where(eq(bots.id, botId))
      .limit(1)

    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found",
      })
      return
    }

    const [convo] = await db
      .insert(conversations)
      .values({
        botId,
        visitorId,
        status: "bot",
      })
      .returning()

    const response: Conversation = {
      id: convo.id,
      bot_id: convo.botId,
      visitor_id: convo.visitorId,
      status: convo.status,
      visitor_name: convo.visitorName,
      visitor_email: convo.visitorEmail,
      created_at: convo.createdAt.toISOString(),
      message_count: 0,
    }

    res.status(201).json(response)
  }
)

/**
 * GET /api/chat/:botId/conversations/:convoId/messages
 * Fetch message history for widget reload or resumption
 */
chatRouter.get(
  "/:botId/conversations/:convoId/messages",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const convoId = String(req.params.convoId)

    const [convo] = await db
      .select()
      .from(conversations)
      .where(
        and(eq(conversations.id, convoId), eq(conversations.botId, botId))
      )
      .limit(1)

    if (!convo) {
      res.status(404).json({
        error: "Not Found",
        message: "Conversation not found",
      })
      return
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
    const offset = Math.max(Number(req.query.offset) || 0, 0)

    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convoId))
      .orderBy(asc(messages.createdAt))
      .limit(limit)
      .offset(offset)

    const response: Message[] = msgList.map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      role: m.role as "user" | "assistant" | "system" | "agent",
      content: m.content,
      is_human: m.isHuman ?? false,
      sender_name: m.senderName,
      created_at: m.createdAt.toISOString(),
    }))

    res.json(response)
  }
)

/**
 * GET /api/chat/:botId/conversations/:convoId/events
 * Persistent SSE event stream for the visitor widget to receive human agent replies,
 * typing indicators, and handoff status in real time.
 */
chatRouter.get(
  "/:botId/conversations/:convoId/events",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const convoId = String(req.params.convoId)

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders?.()

    // Send initial connected acknowledgement
    res.write(`data: ${JSON.stringify({ type: "connected", conversationId: convoId })}\n\n`)

    const unregister = registerVisitorStream(convoId, res)

    // Keep connection alive with periodic heartbeat comment
    const heartbeat = setInterval(() => {
      try {
        res.write(": keepalive\n\n")
      } catch {
        clearInterval(heartbeat)
      }
    }, 25000)

    req.on("close", () => {
      clearInterval(heartbeat)
      unregister()
    })
  }
)

/**
 * POST /api/chat/:botId/conversations/:convoId/handoff
 * Explicit visitor request to speak with a human support agent
 */
chatRouter.post(
  "/:botId/conversations/:convoId/handoff",
  validate({ params: ConvoIdParamSchema, body: HandoffRequestSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const convoId = String(req.params.convoId)
    const { visitorName, visitorEmail, reason } = req.body

    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.id, botId))
      .limit(1)

    if (!bot) {
      res.status(404).json({ error: "Not Found", message: "Bot not found" })
      return
    }

    const [convo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, convoId), eq(conversations.botId, botId)))
      .limit(1)

    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }

    // Update conversation status to waiting_agent
    await db
      .update(conversations)
      .set({
        status: "waiting_agent",
        visitorName: visitorName || convo.visitorName || null,
        visitorEmail: visitorEmail || convo.visitorEmail || null,
        escalationReason: "visitor_requested",
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, convoId))

    // Check if ticket already exists
    const [existingTicket] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.conversationId, convoId))
      .limit(1)

    if (!existingTicket) {
      await db.insert(tickets).values({
        orgId: bot.orgId,
        botId,
        conversationId: convoId,
        status: "open",
        priority: "high",
        escalationReason: "visitor_requested",
        visitorName: visitorName || convo.visitorName || null,
        visitorEmail: visitorEmail || convo.visitorEmail || null,
        aiSummary: reason || "Visitor requested human support assistance.",
      })
    }

    // Insert system notification message in conversation transcript
    const [sysMsg] = await db
      .insert(messages)
      .values({
        conversationId: convoId,
        role: "system",
        content: "Visitor requested human support assistance. An agent will be connected shortly.",
      })
      .returning()

    // 1. Push handoff status to visitor SSE stream
    pushToVisitor(convoId, "handoff_status", {
      status: "waiting_agent",
      message: "Connecting you to a support agent...",
    })

    // 2. Broadcast to Admin WebSockets
    broadcastToOrg(bot.orgId, {
      type: "ticket:created",
      payload: {
        conversationId: convoId,
        botId,
        status: "open",
        visitorName: visitorName || convo.visitorName,
        visitorEmail: visitorEmail || convo.visitorEmail,
      },
    })

    broadcastToConversation(convoId, {
      type: "message:new",
      payload: {
        id: sysMsg.id,
        conversation_id: sysMsg.conversationId,
        role: sysMsg.role,
        content: sysMsg.content,
        created_at: sysMsg.createdAt.toISOString(),
      },
    })

    res.json({
      success: true,
      status: "waiting_agent",
      message: "Support ticket opened. A human agent will assist you shortly.",
    })
  }
)

/**
 * POST /api/chat/:botId
 * Send a message -> route to human agent if active, OR embed + RAG -> stream Mistral answer
 */
chatRouter.post(
  "/:botId",
  validate({ params: BotIdParamSchema, body: SendChatMessageSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const { conversationId: inputConvoId, visitorId, message: userMessage } = req.body

    // 1. Verify bot exists
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.id, botId))
      .limit(1)

    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found",
      })
      return
    }

    // 2. Ensure active conversation; fail with 404 if provided ID is invalid
    let activeConvoId = inputConvoId
    let convoStatus = "bot"

    if (activeConvoId) {
      const [existingConvo] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, activeConvoId),
            eq(conversations.botId, botId)
          )
        )
        .limit(1)

      if (!existingConvo) {
        res.status(404).json({
          error: "Not Found",
          message: `Conversation '${activeConvoId}' not found for this bot`,
        })
        return
      }
      convoStatus = existingConvo.status || "bot"
    } else {
      const [newConvo] = await db
        .insert(conversations)
        .values({
          botId,
          visitorId,
          status: "bot",
        })
        .returning()
      activeConvoId = newConvo.id
    }

    // 3. Save visitor message to database
    const [savedUserMsg] = await db
      .insert(messages)
      .values({
        conversationId: activeConvoId,
        role: "user",
        content: userMessage,
      })
      .returning()

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, activeConvoId))

    const formattedUserMsg = {
      id: savedUserMsg.id,
      conversation_id: savedUserMsg.conversationId,
      role: savedUserMsg.role,
      content: savedUserMsg.content,
      created_at: savedUserMsg.createdAt.toISOString(),
    }

    // Broadcast user message to subscribed admin dashboard tabs
    broadcastToConversation(activeConvoId, {
      type: "message:new",
      payload: formattedUserMsg,
    })

    broadcastToOrg(bot.orgId, {
      type: "conversation:updated",
      payload: {
        conversationId: activeConvoId,
        status: convoStatus,
        lastMessage: userMessage,
      },
    })

    // ─── 4. IF CONVERSATION IS IN HUMAN HANDOFF: DO NOT INVOKE AI ──────────
    if (convoStatus === "waiting_agent" || convoStatus === "agent_active") {
      res.setHeader("Content-Type", "text/event-stream")
      res.setHeader("Cache-Control", "no-cache, no-transform")
      res.setHeader("Connection", "keep-alive")
      res.flushHeaders?.()

      res.write(
        `data: ${JSON.stringify({
          type: "meta",
          conversationId: activeConvoId,
          status: convoStatus,
        })}\n\n`
      )

      res.write(
        `data: ${JSON.stringify({
          type: "status",
          status: convoStatus,
          message:
            convoStatus === "agent_active"
              ? "Message delivered to support agent."
              : "Message delivered. Waiting for next available agent...",
        })}\n\n`
      )

      res.write(
        `data: ${JSON.stringify({
          type: "done",
          conversationId: activeConvoId,
        })}\n\n`
      )
      res.end()

      // Trigger Inngest event in background for sentiment tracking
      inngest
        .send({
          name: "chat/turn.completed",
          data: {
            botId,
            conversationId: activeConvoId,
            userMessage,
            assistantMessage: "(Routed to human agent)",
            visitorId,
          },
        })
        .catch((err) => logger.warn(err, "[Inngest] Failed to send turn event"))

      return
    }

    // ─── 5. AI BOT GENERATION FLOW ──────────────────────────────────────────
    // 5a. Generate embedding for user query
    let relevantChunks: RelevantChunk[] = []
    try {
      const { embedding } = await embedText(userMessage)
      relevantChunks = await findRelevantChunks(botId, embedding, 5)
    } catch (err) {
      logger.warn(err, "Embedding search failed, proceeding with prompt only")
    }

    // 5b. Fetch recent conversation history
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, activeConvoId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(10)

    const history = recentMessages.reverse()

    // 5c. Build RAG prompt with system prompt & retrieved chunks
    const priorHistory = history.slice(0, -1).map((m) => ({
      role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant" | "system",
      content: m.content,
    }))
    const { system, messages: promptMessages } = buildRagPrompt(
      bot.systemPrompt,
      relevantChunks,
      priorHistory,
      userMessage
    )

    // 5d. Setup SSE streaming headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders?.()

    res.write(
      `data: ${JSON.stringify({
        type: "meta",
        conversationId: activeConvoId,
      })}\n\n`
    )

    try {
      const streamResult = streamText({
        system,
        messages: promptMessages,
      })

      let fullAssistantText = ""

      for await (const textDelta of streamResult.textStream) {
        fullAssistantText += textDelta
        res.write(
          `data: ${JSON.stringify({
            type: "delta",
            text: textDelta,
          })}\n\n`
        )
      }

      // Persist assistant message to database
      if (fullAssistantText.trim()) {
        const [savedAssistantMsg] = await db
          .insert(messages)
          .values({
            conversationId: activeConvoId,
            role: "assistant",
            content: fullAssistantText,
          })
          .returning()

        // Broadcast assistant response to admin tabs watching this convo
        broadcastToConversation(activeConvoId, {
          type: "message:new",
          payload: {
            id: savedAssistantMsg.id,
            conversation_id: savedAssistantMsg.conversationId,
            role: savedAssistantMsg.role,
            content: savedAssistantMsg.content,
            created_at: savedAssistantMsg.createdAt.toISOString(),
          },
        })
      }

      res.write(
        `data: ${JSON.stringify({
          type: "done",
          conversationId: activeConvoId,
        })}\n\n`
      )
      res.end()

      // Asynchronously trigger Inngest sentiment, frustration & escalation analysis
      inngest
        .send({
          name: "chat/turn.completed",
          data: {
            botId,
            conversationId: activeConvoId,
            userMessage,
            assistantMessage: fullAssistantText,
            visitorId,
          },
        })
        .catch((err) => logger.warn(err, "[Inngest] Failed to dispatch turn.completed event"))
    } catch (streamErr) {
      logger.error(streamErr, "[Stream Error]")
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Failed to generate AI response",
        })}\n\n`
      )
      res.end()
    }
  }
)
