import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import {
  startTestServer,
  stopTestServer,
  getBaseUrl,
  authHeaders,
  TEST_ORG_ID,
} from "./setup"
import { db } from "db"
import { bots, conversations, messages } from "db/schema"
import { eq } from "drizzle-orm"

describe("Analytics & Conversation Reporting Routes", () => {
  let botId = ""
  let convoId = ""

  beforeAll(async () => {
    await startTestServer()

    const [bot] = await db
      .insert(bots)
      .values({
        orgId: TEST_ORG_ID,
        name: "Analytics Package Bot",
      })
      .returning()
    botId = bot.id

    const [convo] = await db
      .insert(conversations)
      .values({
        botId,
        visitorId: "vis_pkg_analytics_test",
      })
      .returning()
    convoId = convo.id

    await db.insert(messages).values([
      {
        conversationId: convoId,
        role: "user",
        content: "What are your shipping rates?",
      },
      {
        conversationId: convoId,
        role: "assistant",
        content: "Standard shipping is free on orders over $50.",
      },
    ])
  })

  afterAll(async () => {
    await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("GET /api/bots/:botId/conversations returns paginated conversation list", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/bots/${botId}/conversations?limit=10&offset=0`,
      { headers: authHeaders }
    )

    expect(res.status).toBe(200)
    const list = await res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list[0].id).toBe(convoId)
    expect(list[0].message_count).toBe(2)
  })

  it("GET /api/bots/:botId/conversations/:convoId returns full conversation transcript", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/bots/${botId}/conversations/${convoId}`,
      { headers: authHeaders }
    )

    expect(res.status).toBe(200)
    const transcript = await res.json()
    expect(Array.isArray(transcript)).toBe(true)
    expect(transcript.length).toBe(2)
    expect(transcript[0].role).toBe("user")
    expect(transcript[1].role).toBe("assistant")
  })

  it("GET /api/bots/:botId/stats calculates aggregated bot metrics", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots/${botId}/stats`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const stats = await res.json()
    expect(typeof stats.totalMessages).toBe("number")
    expect(stats.totalMessages).toBeGreaterThanOrEqual(2)
    expect(typeof stats.activeConversations).toBe("number")
    expect(stats.activeConversations).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(stats.messagesPerDay)).toBe(true)
  })

  it("GET /api/conversations/:convoId/messages returns messages via direct route", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/conversations/${convoId}/messages`,
      { headers: authHeaders }
    )

    expect(res.status).toBe(200)
    const msgs = await res.json()
    expect(Array.isArray(msgs)).toBe(true)
    expect(msgs.length).toBe(2)
  })
})
