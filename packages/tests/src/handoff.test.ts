import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import {
  startTestServer,
  stopTestServer,
  getBaseUrl,
  authHeaders,
} from "./setup"
import { db } from "db"
import { bots, conversations } from "db/schema"
import { eq } from "drizzle-orm"

describe("Human-in-the-Loop Handoff & Realtime", () => {
  let botId = ""
  let convoId = ""
  const visitorId = "visitor_hil_1"

  beforeAll(async () => {
    await startTestServer()
    const [bot] = await db
      .insert(bots)
      .values({ orgId: "org_package_test", name: "HIL Bot" })
      .returning()
    botId = bot.id

    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
    expect(res.status).toBe(201)
    const convo = await res.json()
    convoId = convo.id
  })

  afterAll(async () => {
    if (botId) await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("visitor SSE stream requires visitorId and rejects mismatches", async () => {
    const noVisitor = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${convoId}/stream`
    )
    expect(noVisitor.status).toBe(400)

    const wrong = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${convoId}/stream?visitorId=someone-else`
    )
    expect(wrong.status).toBe(403)
  })

  it("POST escalate moves conversation to queue", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${convoId}/escalate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, reason: "Need a human please" }),
      }
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("queued")

    const [convo] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convoId))
      .limit(1)
    expect(convo.status).toBe("queued")
  })

  it("bot stays silent while queued (suppression, no AI call)", async () => {
    const res = await fetch(`${getBaseUrl()}/api/chat/${botId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convoId, visitorId, message: "hello?" }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("text/event-stream")
    const text = await res.text()
    expect(text).toContain("status_changed")
    expect(text).toContain("queued")
  })

  it("agent takeover -> reply as agent -> resolve", async () => {
    const takeover = await fetch(
      `${getBaseUrl()}/api/bots/${botId}/conversations/${convoId}/takeover`,
      { method: "POST", headers: authHeaders }
    )
    expect(takeover.status).toBe(200)
    expect((await takeover.json()).status).toBe("human")

    const replyRes = await fetch(
      `${getBaseUrl()}/api/bots/${botId}/conversations/${convoId}/reply`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ content: "Hi, I am a human agent. How can I help?" }),
      }
    )
    expect(replyRes.status).toBe(201)
    const reply = await replyRes.json()
    expect(reply.role).toBe("agent")
    expect(reply.sender_id).toBe("user_package_test")

    const history = await fetch(
      `${getBaseUrl()}/api/chat/${botId}/conversations/${convoId}/messages`
    )
    expect(history.status).toBe(200)
    const msgs = await history.json()
    expect(msgs.some((m: { role: string }) => m.role === "agent")).toBe(true)

    const resolve = await fetch(
      `${getBaseUrl()}/api/bots/${botId}/conversations/${convoId}/resolve`,
      { method: "POST", headers: authHeaders }
    )
    expect(resolve.status).toBe(200)
    expect((await resolve.json()).status).toBe("resolved")
  })
})
