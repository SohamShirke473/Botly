import { Router, type Request, type Response } from "express"
import { db } from "db"
import { bots, conversations, messages } from "db/schema"
import { eq, and, asc, desc } from "drizzle-orm"
import { validate } from "../middleware/validate"
import { chatRateLimiter } from "../middleware/rate-limit"
import { embedText, streamText } from "@botly/ai"
import { findRelevantChunks, buildRagPrompt, type RelevantChunk } from "../lib/rag"
import { logger } from "../lib/logger"
import {
  BotIdParamSchema,
  ConvoIdParamSchema,
  StartConversationSchema,
  SendChatMessageSchema,
  DEFAULT_WIDGET_CONFIG,
  type WidgetConfig,
  type BotPublicConfig,
  type Conversation,
  type Message,
} from "types"
import { subscribeSSE } from "../realtime/hub"

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
      })
      .returning()

    const response: Conversation = {
      id: convo.id,
      bot_id: convo.botId,
      visitor_id: convo.visitorId,
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
      .select({ id: conversations.id })
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
      role: m.role,
      content: m.content,
      sender_id: m.senderId ?? undefined,
      created_at: m.createdAt.toISOString(),
    }))

    res.json(response)
  }
)

/**
 * GET /api/chat/:botId/conversations/:convoId/stream
 * Visitor-only Server-Sent Events stream (no WebSocket for end users).
 * Query: ?visitorId=... must match the conversation owner.
 * Emits RealtimeEvent JSON per SSE frame: agent_message, status_changed, typing, etc.
 */
chatRouter.get(
  "/:botId/conversations/:convoId/stream",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const convoId = String(req.params.convoId)
    const visitorId = String(req.query.visitorId ?? "")

    if (!visitorId) {
      res.status(400).json({
        error: "Bad Request",
        message: "visitorId query param is required",
      })
      return
    }

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

    if (convo.visitorId !== visitorId) {
      res.status(403).json({
        error: "Forbidden",
        message: "visitorId does not match this conversation",
      })
      return
    }

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders?.()

    // Initial hello with current handoff status so widget can render banner
    res.write(
      `data: ${JSON.stringify({
        type: "status_changed",
        botId,
        conversationId: convoId,
        status: convo.status,
      })}\n\n`
    )

    const unsubscribe = subscribeSSE(botId, convoId, res, visitorId)

    const ping = setInterval(() => {
      try {
        res.write(`: ping\n\n`)
      } catch {
        // ignore — close handler cleans up
      }
    }, 25000)

    req.on("close", () => {
      clearInterval(ping)
      unsubscribe()
    })
  }
)

/**
 * POST /api/chat/:botId
 * Send a message -> embed -> pgvector search -> stream Mistral answer
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
    } else {
      const [newConvo] = await db
        .insert(conversations)
        .values({
          botId,
          visitorId,
        })
        .returning()
      activeConvoId = newConvo.id
    }

    // 3. Save visitor message to database
    await db.insert(messages).values({
      conversationId: activeConvoId,
      role: "user",
      content: userMessage,
    })

    // 4. Generate embedding for user query
    let relevantChunks: RelevantChunk[] = []
    try {
      const { embedding } = await embedText(userMessage)
      relevantChunks = await findRelevantChunks(botId, embedding, 5)
    } catch (err) {
      logger.warn(err, "Embedding search failed, proceeding with prompt only")
    }

    // 5. Fetch recent conversation history (most recent 10 messages, then sort chronologically)
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, activeConvoId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(10)

    const history = recentMessages.reverse().map((m) => ({
      role:
        m.role === "agent"
          ? ("assistant" as const)
          : (m.role as "user" | "assistant" | "system"),
      content: m.content,
    }))

    // 6. Build RAG prompt with system prompt & retrieved chunks
    const priorHistory = history.slice(0, -1) // exclude current user message from history array
    const { system, messages: promptMessages } = buildRagPrompt(
      bot.systemPrompt,
      relevantChunks,
      priorHistory,
      userMessage
    )

    // 7. Setup SSE streaming headers
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders?.()

    // Send conversationId metadata as first event
    res.write(
      `data: ${JSON.stringify({
        type: "meta",
        conversationId: activeConvoId,
      })}\n\n`
    )

    try {
      // 8. Stream text using Mistral via @botly/ai
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

      // 9. Persist assistant message to database
      if (fullAssistantText.trim()) {
        await db.insert(messages).values({
          conversationId: activeConvoId,
          role: "assistant",
          content: fullAssistantText,
        })
      }

      res.write(
        `data: ${JSON.stringify({
          type: "done",
          conversationId: activeConvoId,
        })}\n\n`
      )
      res.end()
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
