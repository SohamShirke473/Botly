import { Router, type Request, type Response } from "express"
import { db } from "db"
import {
  bots,
  conversations,
  messages,
  documents,
  chunks,
  tickets,
} from "db/schema"
import { eq, and, desc, asc, sql } from "drizzle-orm"
import { requireOrgAuth, verifyBotOrgAccess } from "../middleware/auth"
import { validate } from "../middleware/validate"
import {
  pushToVisitor,
  broadcastToConversation,
  broadcastToOrg,
} from "../lib/realtime"
import {
  BotIdParamSchema,
  ConvoIdParamSchema,
  SingleConvoIdParamSchema,
  AgentSendMessageSchema,
  type Conversation,
  type Message,
  type BotStatsResponse,
} from "types"

export const analyticsRouter = Router({ mergeParams: true })

// All analytics routes require organization authentication
analyticsRouter.use(requireOrgAuth)

/**
 * GET /api/bots/:botId/conversations
 * List all conversations for a bot (with last message & message count)
 */
analyticsRouter.get(
  "/:botId/conversations",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100)
    const offset = Math.max(Number(req.query.offset) || 0, 0)

    const convos = await db
      .select({
        id: conversations.id,
        botId: conversations.botId,
        visitorId: conversations.visitorId,
        status: conversations.status,
        visitorName: conversations.visitorName,
        visitorEmail: conversations.visitorEmail,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        messageCount: sql<number>`count(${messages.id})::int`,
        lastMessage: sql<string | null>`(
          SELECT content FROM messages
          WHERE messages.conversation_id = ${conversations.id}
          ORDER BY messages.created_at DESC
          LIMIT 1
        )`,
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.botId, botId))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.createdAt))
      .limit(limit)
      .offset(offset)

    const response: Conversation[] = convos.map((c) => ({
      id: c.id,
      bot_id: c.botId,
      visitor_id: c.visitorId,
      status: c.status ?? "bot",
      visitor_name: c.visitorName,
      visitor_email: c.visitorEmail,
      created_at: c.createdAt.toISOString(),
      last_message_at: c.lastMessageAt?.toISOString(),
      message_count: c.messageCount,
      last_message: c.lastMessage ?? undefined,
    }))

    res.json(response)
  }
)

/**
 * GET /api/bots/:botId/conversations/:convoId
 * View one full conversation transcript
 */
analyticsRouter.get(
  "/:botId/conversations/:convoId",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)
    const convoId = String(req.params.convoId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const [convo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, convoId), eq(conversations.botId, botId)))
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

    const formattedMessages: Message[] = msgList.map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      role: m.role,
      content: m.content,
      created_at: m.createdAt.toISOString(),
    }))

    res.json(formattedMessages)
  }
)

/**
 * GET /api/bots/:botId/stats
 * Basic counts: messages/day, active conversations, doc count, chunk count
 */
analyticsRouter.get(
  "/:botId/stats",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    // 1. Total conversations count
    const [convoStat] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(eq(conversations.botId, botId))

    // 2. Total messages count
    const [msgStat] = await db
      .select({ count: sql<number>`count(${messages.id})::int` })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(eq(conversations.botId, botId))

    // 3. Document counts (total & ready)
    const [docStat] = await db
      .select({
        total: sql<number>`count(*)::int`,
        ready: sql<number>`count(*) filter (where status = 'ready')::int`,
      })
      .from(documents)
      .where(eq(documents.botId, botId))

    // 4. Total chunks count
    const [chunkStat] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chunks)
      .where(eq(chunks.botId, botId))

    // 5. Messages per day (last 14 days)
    const dailyStats = await db
      .select({
        date: sql<string>`to_char(${messages.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(
          eq(conversations.botId, botId),
          sql`${messages.createdAt} >= NOW() - INTERVAL '14 days'`
        )
      )
      .groupBy(sql`to_char(${messages.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${messages.createdAt}, 'YYYY-MM-DD') ASC`)

    const response: BotStatsResponse = {
      totalMessages: msgStat?.count ?? 0,
      activeConversations: convoStat?.count ?? 0,
      totalDocuments: docStat?.total ?? 0,
      readyDocuments: docStat?.ready ?? 0,
      totalChunks: chunkStat?.count ?? 0,
      messagesPerDay: dailyStats,
    }

    res.json(response)
  }
)

// ─── Direct /api/conversations/:convoId/messages route for web client ───

export const directConversationsRouter = Router()
directConversationsRouter.use(requireOrgAuth)

directConversationsRouter.get(
  "/:convoId/messages",
  validate({ params: SingleConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const convoId = String(req.params.convoId)

    const [record] = await db
      .select({
        convo: conversations,
        botOrgId: bots.orgId,
      })
      .from(conversations)
      .innerJoin(bots, eq(bots.id, conversations.botId))
      .where(eq(conversations.id, convoId))
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Conversation not found or access denied",
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
      is_human: m.isHuman ?? false,
      sender_name: m.senderName,
      created_at: m.createdAt.toISOString(),
    }))

    res.json(response)
  }
)

/**
 * POST /api/conversations/:convoId/messages
 * Support agent sends a message directly to this conversation
 */
directConversationsRouter.post(
  "/:convoId/messages",
  validate({ params: SingleConvoIdParamSchema, body: AgentSendMessageSchema }),
  async (req: Request, res: Response) => {
    const { orgId, userId } = req.authContext!
    const convoId = String(req.params.convoId)
    const { content } = req.body

    const [record] = await db
      .select({
        convo: conversations,
        botOrgId: bots.orgId,
      })
      .from(conversations)
      .innerJoin(bots, eq(bots.id, conversations.botId))
      .where(eq(conversations.id, convoId))
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Conversation not found or access denied",
      })
      return
    }

    const agentName = "Support Agent"

    // 1. Insert message
    const [insertedMsg] = await db
      .insert(messages)
      .values({
        conversationId: convoId,
        role: "agent",
        content: content.trim(),
        isHuman: true,
        senderName: agentName,
        senderId: userId,
      })
      .returning()

    // 2. Mark conversation agent_active
    await db
      .update(conversations)
      .set({
        status: "agent_active",
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, convoId))

    // 3. Update any ticket for this conversation to in_progress
    await db
      .update(tickets)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(tickets.conversationId, convoId))

    const formattedMsg: Message = {
      id: insertedMsg.id,
      conversation_id: insertedMsg.conversationId,
      role: "agent",
      content: insertedMsg.content,
      is_human: true,
      sender_name: agentName,
      created_at: insertedMsg.createdAt.toISOString(),
    }

    // 4. Push to visitor SSE stream
    pushToVisitor(convoId, "agent_message", formattedMsg)

    // 5. Broadcast to Admin WS
    broadcastToConversation(convoId, {
      type: "message:new",
      payload: formattedMsg,
    })

    broadcastToOrg(orgId, {
      type: "conversation:updated",
      payload: {
        conversationId: convoId,
        status: "agent_active",
        lastMessage: content.trim(),
      },
    })

    res.status(201).json(formattedMsg)
  }
)

/**
 * PATCH /api/conversations/:convoId/status
 * Update conversation status (takeover as agent, return to bot, or resolve)
 */
directConversationsRouter.patch(
  "/:convoId/status",
  validate({ params: SingleConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const convoId = String(req.params.convoId)
    const { status } = req.body

    if (!status || typeof status !== "string") {
      res.status(400).json({ error: "Bad Request", message: "Missing status" })
      return
    }

    const [record] = await db
      .select({
        convo: conversations,
        botOrgId: bots.orgId,
      })
      .from(conversations)
      .innerJoin(bots, eq(bots.id, conversations.botId))
      .where(eq(conversations.id, convoId))
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Conversation not found or access denied",
      })
      return
    }

    await db
      .update(conversations)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, convoId))

    if (status === "resolved") {
      await db
        .update(tickets)
        .set({ status: "resolved", updatedAt: new Date() })
        .where(eq(tickets.conversationId, convoId))

      pushToVisitor(convoId, "handoff_status", {
        status: "resolved",
        message: "Support session resolved.",
      })
    } else if (status === "bot") {
      pushToVisitor(convoId, "handoff_status", {
        status: "bot",
        message: "Conversation handed back to AI Assistant.",
      })
    }

    broadcastToConversation(convoId, {
      type: "conversation:status_changed",
      payload: { conversationId: convoId, status },
    })

    broadcastToOrg(orgId, {
      type: "conversation:updated",
      payload: { conversationId: convoId, status },
    })

    res.json({ success: true, status })
  }
)
