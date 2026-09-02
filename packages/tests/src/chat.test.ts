import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { startTestServer, stopTestServer, getBaseUrl } from "./setup"
import { db } from "db"
import { bots } from "db/schema"
import { eq } from "drizzle-orm"

describe("Public Chat & Widget Streaming Routes", () => {
  let botId = ""
  let conversationId = ""

  beforeAll(async () => {
    await startTestServer()

    const [bot] = await db
      .insert(bots)
      .values({
        orgId: "org_chat_pkg_test",
        name: "Support Bot",
        systemPrompt: "You are a helpful customer support agent.",
        widgetTheme: {
          theme: {
            primaryColor: "#4f46e5",
            position: "bottom-right",
            bubbleIcon: "chat",
          },
          greeting: "How can I help you?",
          placeholder: "Ask a question...",
          showBranding: true,
        },
      })
      .returning()
    botId = bot.id
  })

  afterAll(async () => {
    await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("GET /api/chat/:botId/config returns public widget theme without auth", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}/config`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.id).toBe(botId)
    expect(data.name).toBe("Support Bot")
    expect(data.widgetConfig.theme.primaryColor).toBe("#4f46e5")
  })

  it("POST /api/chat/:botId/conversations starts a new visitor session", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: "visitor_pkg_user_1" }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.bot_id).toBe(botId)
    expect(data.visitor_id).toBe("visitor_pkg_user_1")

    conversationId = data.id
  })

  it("POST /api/chat/:botId streams response via Server-Sent Events", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        visitorId: "visitor_pkg_user_1",
        message: "Hello! What are your business hours?",
      }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/event-stream")

    const reader = res.body?.getReader()
    expect(reader).toBeDefined()

    const decoder = new TextDecoder()
    let streamText = ""
    while (true) {
      const { done, value } = await reader!.read()
      if (done) break
      streamText += decoder.decode(value, { stream: true })
    }

    expect(streamText).toContain('"type":"meta"')
    expect(streamText).toContain(conversationId)
  })

  it("POST /api/chat/:botId with invalid conversationId returns 404", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "00000000-0000-0000-0000-000000000000",
        visitorId: "visitor_pkg_user_1",
        message: "This should fail",
      }),
    })

    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toBe("Not Found")
  })

  it("GET /api/chat/:botId/conversations/:convoId/messages returns messages with pagination", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${conversationId}/messages?limit=10&offset=0`
    )

    expect(res.status).toBe(200)
    const messages = await res.json()
    expect(Array.isArray(messages)).toBe(true)
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(messages[0].conversation_id).toBe(conversationId)
  })
})
