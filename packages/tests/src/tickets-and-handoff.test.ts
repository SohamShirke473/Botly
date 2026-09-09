import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import {
  startTestServer,
  stopTestServer,
  getBaseUrl,
  authHeaders,
  TEST_ORG_ID,
} from "./setup"
import { db } from "db"
import { bots, conversations, messages, tickets } from "db/schema"
import { eq } from "drizzle-orm"
import type { Ticket } from "types"

describe("Support Tickets & Real-Time Human Handoff Routes", () => {
  let botId = ""
  let conversationId = ""
  let ticketId = ""

  beforeAll(async () => {
    await startTestServer()

    // 1. Create a test bot
    const [bot] = await db
      .insert(bots)
      .values({
        orgId: TEST_ORG_ID,
        name: "Handoff Test Bot",
        systemPrompt: "You are a test assistant.",
      })
      .returning()
    botId = bot.id

    // 2. Create a test visitor conversation
    const [convo] = await db
      .insert(conversations)
      .values({
        botId,
        visitorId: "visitor_handoff_test_1",
        status: "bot",
      })
      .returning()
    conversationId = convo.id

    // 3. Add an initial user message
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content:
        "I need help with my account billing, please connect me to a human agent.",
    })
  })

  afterAll(async () => {
    await db.delete(tickets).where(eq(tickets.conversationId, conversationId))
    await db.delete(messages).where(eq(messages.conversationId, conversationId))
    await db.delete(conversations).where(eq(conversations.id, conversationId))
    await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("POST /api/chat/:botId/conversations/:convoId/handoff initiates visitor handoff", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${conversationId}/handoff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: "Jane Doe",
          visitorEmail: "jane@example.com",
          reason: "Need billing assistance",
        }),
      }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.status).toBe("waiting_agent")
    expect(data.ticketId).toBeDefined()
    ticketId = data.ticketId

    // Verify conversation status updated
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)

    expect(convo.status).toBe("waiting_agent")
    expect(convo.visitorName).toBe("Jane Doe")
    expect(convo.visitorEmail).toBe("jane@example.com")
  })

  it("POST /api/chat/:botId bypasses AI inference when status is waiting_agent", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        visitorId: "visitor_handoff_test_1",
        message: "Are you there? Still waiting for support.",
      }),
    })

    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('"status":"waiting_agent"')
    expect(text).toContain("Waiting for next available agent")
  })

  it("GET /api/tickets lists tickets for the active organization", async () => {
    const res = await fetch(`${getBaseUrl()}/api/tickets`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const ticketList = await res.json()
    expect(Array.isArray(ticketList)).toBe(true)

    const found = ticketList.find((t: Ticket) => t.id === ticketId)
    expect(found).toBeDefined()
    expect(found.status).toBe("open")
    expect(found.visitor_name).toBe("Jane Doe")
    expect(found.bot_name).toBe("Handoff Test Bot")
  })

  it("GET /api/tickets/:id returns ticket details and full message transcript", async () => {
    const res = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ticket).toBeDefined()
    expect(data.ticket.id).toBe(ticketId)
    expect(data.messages).toBeDefined()
    expect(Array.isArray(data.messages)).toBe(true)
    expect(data.messages.length).toBeGreaterThanOrEqual(1)
  })

  it("POST /api/tickets/:id/messages allows support agent to reply directly", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/tickets/${ticketId}/messages`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          content: "Hello Jane! I am taking a look at your billing now.",
        }),
      }
    )

    expect(res.status).toBe(201)
    const msg = await res.json()
    expect(msg.role).toBe("agent")
    expect(msg.is_human).toBe(true)
    expect(msg.content).toContain("taking a look at your billing")

    // Check that ticket is now in_progress and conversation is agent_active
    const [ticketRecord] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)
    expect(ticketRecord.status).toBe("in_progress")

    const [convoRecord] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    expect(convoRecord.status).toBe("agent_active")
  })

  it("PATCH /api/tickets/:id updates ticket status and resolves session", async () => {
    const res = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "resolved",
        priority: "low",
      }),
    })

    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.status).toBe("resolved")
    expect(updated.priority).toBe("low")

    // Conversation should also be synced to resolved
    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    expect(convo.status).toBe("resolved")
  })

  it("PATCH /api/conversations/:convoId/status allows handing back to AI", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/conversations/${conversationId}/status`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "bot" }),
      }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.status).toBe("bot")

    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1)
    expect(convo.status).toBe("bot")
  })

  it("POST /api/conversations/:convoId/messages allows direct agent replies", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          content: "Let us know if you need any further assistance!",
        }),
      }
    )

    expect(res.status).toBe(201)
    const msg = await res.json()
    expect(msg.role).toBe("agent")
    expect(msg.is_human).toBe(true)
    expect(msg.content).toContain("further assistance")
  })
})
