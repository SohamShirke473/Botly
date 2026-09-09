import { Router, type Request, type Response } from "express"
import { db } from "db"
import { tickets, bots, conversations, messages } from "db/schema"
import { eq, and, desc, sql, asc } from "drizzle-orm"
import { requireOrgAuth } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { logger } from "../lib/logger"
import {
  pushToVisitor,
  broadcastToConversation,
  broadcastToOrg,
} from "../lib/realtime"
import {
  UpdateTicketSchema,
  AgentSendMessageSchema,
  type Ticket,
  type Message,
} from "types"

export const ticketsRouter = Router()

// Require organization authentication for all ticket routes
ticketsRouter.use(requireOrgAuth)

/**
 * GET /api/tickets
 * List all support tickets for the active organization with optional status & priority filters
 */
ticketsRouter.get("/", async (req: Request, res: Response) => {
  const { orgId } = req.authContext!
  const { status, priority, botId } = req.query

  const conditions = [eq(tickets.orgId, orgId)]

  if (status && typeof status === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conditions.push(eq(tickets.status, status as any))
  }

  if (priority && typeof priority === "string") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conditions.push(eq(tickets.priority, priority as any))
  }

  if (botId && typeof botId === "string") {
    conditions.push(eq(tickets.botId, botId))
  }

  const rawTickets = await db
    .select({
      id: tickets.id,
      orgId: tickets.orgId,
      botId: tickets.botId,
      conversationId: tickets.conversationId,
      status: tickets.status,
      priority: tickets.priority,
      escalationReason: tickets.escalationReason,
      visitorName: tickets.visitorName,
      visitorEmail: tickets.visitorEmail,
      assignedTo: tickets.assignedTo,
      assignedToName: tickets.assignedToName,
      aiSummary: tickets.aiSummary,
      sentiment: tickets.sentiment,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      botName: bots.name,
      visitorId: conversations.visitorId,
      conversationStatus: conversations.status,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(tickets)
    .innerJoin(bots, eq(tickets.botId, bots.id))
    .innerJoin(conversations, eq(tickets.conversationId, conversations.id))
    .where(and(...conditions))
    .orderBy(desc(tickets.updatedAt))

  // Fetch message counts and last messages for each ticket's conversation
  const ticketDTOs: Ticket[] = await Promise.all(
    rawTickets.map(async (t) => {
      const [lastMsg] = await db
        .select({
          content: messages.content,
        })
        .from(messages)
        .where(eq(messages.conversationId, t.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(1)

      const [countResult] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(messages)
        .where(eq(messages.conversationId, t.conversationId))

      return {
        id: t.id,
        org_id: t.orgId,
        bot_id: t.botId,
        conversation_id: t.conversationId,
        status: t.status,
        priority: t.priority,
        escalation_reason: t.escalationReason,
        visitor_name: t.visitorName,
        visitor_email: t.visitorEmail,
        assigned_to: t.assignedTo,
        assigned_to_name: t.assignedToName,
        ai_summary: t.aiSummary,
        sentiment: t.sentiment,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
        bot_name: t.botName,
        last_message: lastMsg?.content,
        message_count: countResult?.count ?? 0,
      }
    })
  )

  res.json(ticketDTOs)
})

/**
 * GET /api/tickets/:id
 * Get single ticket details and conversation messages
 */
ticketsRouter.get("/:id", async (req: Request, res: Response) => {
  const { orgId } = req.authContext!
  const ticketId = String(req.params.id)

  const [t] = await db
    .select({
      id: tickets.id,
      orgId: tickets.orgId,
      botId: tickets.botId,
      conversationId: tickets.conversationId,
      status: tickets.status,
      priority: tickets.priority,
      escalationReason: tickets.escalationReason,
      visitorName: tickets.visitorName,
      visitorEmail: tickets.visitorEmail,
      assignedTo: tickets.assignedTo,
      assignedToName: tickets.assignedToName,
      aiSummary: tickets.aiSummary,
      sentiment: tickets.sentiment,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      botName: bots.name,
      visitorId: conversations.visitorId,
    })
    .from(tickets)
    .innerJoin(bots, eq(tickets.botId, bots.id))
    .innerJoin(conversations, eq(tickets.conversationId, conversations.id))
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, orgId)))
    .limit(1)

  if (!t) {
    res.status(404).json({ error: "Not Found", message: "Ticket not found" })
    return
  }

  const rawMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, t.conversationId))
    .orderBy(asc(messages.createdAt))

  const messageDTOs: Message[] = rawMessages.map((m) => ({
    id: m.id,
    conversation_id: m.conversationId,
    role: m.role as "user" | "assistant" | "system" | "agent",
    content: m.content,
    is_human: m.isHuman ?? false,
    sender_name: m.senderName,
    created_at: m.createdAt.toISOString(),
  }))

  const ticketDTO: Ticket = {
    id: t.id,
    org_id: t.orgId,
    bot_id: t.botId,
    conversation_id: t.conversationId,
    status: t.status,
    priority: t.priority,
    escalation_reason: t.escalationReason,
    visitor_name: t.visitorName,
    visitor_email: t.visitorEmail,
    assigned_to: t.assignedTo,
    assigned_to_name: t.assignedToName,
    ai_summary: t.aiSummary,
    sentiment: t.sentiment,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
    bot_name: t.botName,
    message_count: messageDTOs.length,
    last_message: messageDTOs[messageDTOs.length - 1]?.content,
  }

  res.json({
    ticket: ticketDTO,
    messages: messageDTOs,
  })
})

/**
 * PATCH /api/tickets/:id
 * Update ticket status, priority, or assigned agent
 */
ticketsRouter.patch(
  "/:id",
  validate({ body: UpdateTicketSchema }),
  async (req: Request, res: Response) => {
    const { orgId, userId } = req.authContext!
    const ticketId = String(req.params.id)
    const { status, priority, assigned_to, assigned_to_name } = req.body

    const [existing] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, orgId)))
      .limit(1)

    if (!existing) {
      res.status(404).json({ error: "Not Found", message: "Ticket not found" })
      return
    }

    // Prepare ticket updates
    const updates: Partial<typeof tickets.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (status) updates.status = status
    if (priority) updates.priority = priority
    if (assigned_to !== undefined) updates.assignedTo = assigned_to
    if (assigned_to_name !== undefined) updates.assignedToName = assigned_to_name

    // If assigning to self and name wasn't passed
    if (assigned_to === userId && !assigned_to_name) {
      updates.assignedToName = "Agent"
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, ticketId))
      .returning()

    // Sync conversation status
    if (status === "resolved" || status === "closed") {
      await db
        .update(conversations)
        .set({
          status: "resolved",
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, existing.conversationId))

      // Push resolution notice to visitor SSE
      pushToVisitor(existing.conversationId, "handoff_status", {
        status: "resolved",
        message: "Your support session has been resolved. Feel free to ask more questions anytime!",
      })
    } else if (status === "in_progress") {
      await db
        .update(conversations)
        .set({
          status: "agent_active",
          assignedTo: updates.assignedTo || existing.assignedTo,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, existing.conversationId))
    }

    // Broadcast ticket update to Admin WS
    broadcastToOrg(orgId, {
      type: "ticket:updated",
      payload: updatedTicket,
    })

    broadcastToConversation(existing.conversationId, {
      type: "ticket:updated",
      payload: updatedTicket,
    })

    res.json(updatedTicket)
  }
)

/**
 * POST /api/tickets/:id/messages
 * Support agent sends a message to the visitor
 */
ticketsRouter.post(
  "/:id/messages",
  validate({ body: AgentSendMessageSchema }),
  async (req: Request, res: Response) => {
    const { orgId, userId } = req.authContext!
    const ticketId = String(req.params.id)
    const { content } = req.body

    const [t] = await db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, orgId)))
      .limit(1)

    if (!t) {
      res.status(404).json({ error: "Not Found", message: "Ticket not found" })
      return
    }

    const agentName = t.assignedToName || "Support Agent"

    // 1. Insert message into messages table
    const [insertedMsg] = await db
      .insert(messages)
      .values({
        conversationId: t.conversationId,
        role: "agent",
        content: content.trim(),
        isHuman: true,
        senderName: agentName,
        senderId: userId,
      })
      .returning()

    // 2. Mark ticket in_progress and conversation agent_active
    await db
      .update(tickets)
      .set({
        status: "in_progress",
        assignedTo: t.assignedTo || userId,
        assignedToName: agentName,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))

    await db
      .update(conversations)
      .set({
        status: "agent_active",
        lastMessageAt: new Date(),
        assignedTo: t.assignedTo || userId,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, t.conversationId))

    const formattedMsg: Message = {
      id: insertedMsg.id,
      conversation_id: insertedMsg.conversationId,
      role: "agent",
      content: insertedMsg.content,
      is_human: true,
      sender_name: agentName,
      created_at: insertedMsg.createdAt.toISOString(),
    }

    // 3. Push to visitor SSE stream
    pushToVisitor(t.conversationId, "agent_message", formattedMsg)

    // 4. Broadcast to Admin WebSockets
    broadcastToConversation(t.conversationId, {
      type: "message:new",
      payload: formattedMsg,
    })

    broadcastToOrg(orgId, {
      type: "conversation:updated",
      payload: {
        conversationId: t.conversationId,
        status: "agent_active",
        lastMessage: content.trim(),
      },
    })

    res.status(201).json(formattedMsg)
  }
)
