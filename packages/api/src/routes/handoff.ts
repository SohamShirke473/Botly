import { Router, type Request, type Response } from "express"
import cors from "cors"
import { db } from "db"
import { bots, conversations, messages } from "db/schema"
import { eq, and, asc } from "drizzle-orm"
import { validate } from "../middleware/validate"
import {
  requireOrgAuth,
  verifyBotOrgAccess,
} from "../middleware/auth"
import { chatRateLimiter } from "../middleware/rate-limit"
import {
  BotIdParamSchema,
  ConvoIdParamSchema,
  EscalateConversationSchema,
  AgentReplySchema,
  type Message,
} from "types"
import { publish } from "../realtime/hub"
import { logger } from "../lib/logger"

export const handoffRouter = Router({ mergeParams: true })

handoffRouter.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
)
handoffRouter.use(chatRateLimiter)

async function setStatus(
  convoId: string,
  patch: {
    status: "bot" | "queued" | "human" | "resolved"
    assignedAgentId?: string | null
    escalationReason?: string | null
  }
) {
  const [updated] = await db
    .update(conversations)
    .set({
      status: patch.status,
      assignedAgentId: patch.assignedAgentId ?? null,
      escalationReason: patch.escalationReason ?? null,
      escalatedAt:
        patch.status === "queued" || patch.status === "human"
          ? new Date()
          : null,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, convoId))
    .returning()
  return updated
}

/**
 * POST /api/chat/:botId/conversations/:convoId/escalate
 * Visitor (or widget) requests a human. Public, visitorId-verified.
 */
handoffRouter.post(
  "/:botId/conversations/:convoId/escalate",
  validate({ params: ConvoIdParamSchema, body: EscalateConversationSchema }),
  async (req: Request, res: Response) => {
    const botId = String(req.params.botId)
    const convoId = String(req.params.convoId)
    const { reason } = req.body as { reason?: string }
    const visitorId = String(
      (req.body as { visitorId?: string }).visitorId ?? req.query.visitorId ?? ""
    )

    const [convo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, convoId), eq(conversations.botId, botId)))
      .limit(1)

    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    if (visitorId && convo.visitorId !== visitorId) {
      res.status(403).json({ error: "Forbidden", message: "visitorId mismatch" })
      return
    }
    if (convo.status === "human" || convo.status === "queued") {
      res.json({ status: convo.status })
      return
    }

    const updated = await setStatus(convoId, {
      status: "queued",
      escalationReason: reason ?? "Visitor requested a human",
    })

    await db.insert(messages).values({
      conversationId: convoId,
      role: "system",
      content: `Escalated to human queue: ${updated.escalationReason ?? ""}`.trim(),
    })

    publish({
      type: "escalation_request",
      botId,
      conversationId: convoId,
      status: "queued",
      reason: updated.escalationReason ?? undefined,
    })
    publish({ type: "status_changed", botId, conversationId: convoId, status: "queued" })

    logger.info({ botId, convoId }, "Conversation escalated to queue")
    res.status(200).json({ status: "queued" })
  }
)

export const agentRouter = Router({ mergeParams: true })
agentRouter.use(requireOrgAuth)

async function loadConvoForAgent(botId: string, convoId: string, orgId: string) {
  const bot = await verifyBotOrgAccess(botId, orgId)
  if (!bot) return { bot: null, convo: null }
  const [convo] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, convoId), eq(conversations.botId, botId)))
    .limit(1)
  return { bot, convo: convo ?? null }
}

function toMessageDTO(m: typeof messages.$inferSelect): Message {
  return {
    id: m.id,
    conversation_id: m.conversationId,
    role: m.role,
    content: m.content,
    sender_id: m.senderId ?? undefined,
    created_at: m.createdAt.toISOString(),
  }
}

/** POST /api/bots/:botId/conversations/:convoId/takeover — agent takes over */
agentRouter.post(
  "/:botId/conversations/:convoId/takeover",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { userId, orgId } = req.authContext!
    const { botId, convoId } = req.params as { botId: string; convoId: string }
    const { convo } = await loadConvoForAgent(botId, convoId, orgId)
    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    await setStatus(convoId, { status: "human", assignedAgentId: userId })
    publish({ type: "status_changed", botId, conversationId: convoId, status: "human", actorId: userId })
    res.json({ status: "human", assigned_agent_id: userId })
  }
)

/** POST /api/bots/:botId/conversations/:convoId/reply — agent sends message */
agentRouter.post(
  "/:botId/conversations/:convoId/reply",
  validate({ params: ConvoIdParamSchema, body: AgentReplySchema }),
  async (req: Request, res: Response) => {
    const { userId, orgId } = req.authContext!
    const { botId, convoId } = req.params as { botId: string; convoId: string }
    const { content } = req.body as { content: string }
    const { convo } = await loadConvoForAgent(botId, convoId, orgId)
    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    if (convo.status !== "human") {
      await setStatus(convoId, { status: "human", assignedAgentId: userId })
    }
    const [saved] = await db
      .insert(messages)
      .values({ conversationId: convoId, role: "agent", content, senderId: userId })
      .returning()
    const dto = toMessageDTO(saved)
    publish({ type: "agent_message", botId, conversationId: convoId, status: "human", message: dto, actorId: userId })
    res.status(201).json(dto)
  }
)

/** POST /api/bots/:botId/conversations/:convoId/resolve — hand back to bot / close */
agentRouter.post(
  "/:botId/conversations/:convoId/resolve",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { userId, orgId } = req.authContext!
    const { botId, convoId } = req.params as { botId: string; convoId: string }
    const { convo } = await loadConvoForAgent(botId, convoId, orgId)
    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    await setStatus(convoId, { status: "resolved" })
    publish({ type: "status_changed", botId, conversationId: convoId, status: "resolved", actorId: userId })
    res.json({ status: "resolved" })
  }
)

/** POST /api/bots/:botId/conversations/:convoId/release — return to bot */
agentRouter.post(
  "/:botId/conversations/:convoId/release",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { userId, orgId } = req.authContext!
    const { botId, convoId } = req.params as { botId: string; convoId: string }
    const { convo } = await loadConvoForAgent(botId, convoId, orgId)
    if (!convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    await setStatus(convoId, { status: "bot" })
    publish({ type: "status_changed", botId, conversationId: convoId, status: "bot", actorId: userId })
    res.json({ status: "bot" })
  }
)

/** GET transcript (agent view, includes status) */
agentRouter.get(
  "/:botId/conversations/:convoId/messages",
  validate({ params: ConvoIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { botId, convoId } = req.params as { botId: string; convoId: string }
    const { bot, convo } = await loadConvoForAgent(botId, convoId, orgId)
    if (!bot || !convo) {
      res.status(404).json({ error: "Not Found", message: "Conversation not found" })
      return
    }
    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convoId))
      .orderBy(asc(messages.createdAt))
    void bots
    res.json(msgList.map(toMessageDTO))
  }
)
