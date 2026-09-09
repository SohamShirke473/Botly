import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import {
  startTestServer,
  stopTestServer,
  getBaseUrl,
  authHeaders,
  TEST_ORG_ID,
} from "./setup"
import { db } from "db"
import { bots, documents } from "db/schema"
import { eq } from "drizzle-orm"

describe("Bot CRUD & Organization Scoping", () => {
  let createdBotId = ""

  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it("GET /api/bots without auth headers returns 401 Unauthorized", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots`)
    expect(res.status).toBe(401)
  })

  it("POST /api/bots creates a bot with theme and system prompt", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Test Package Bot",
        system_prompt: "You are a bot created in @botly/tests.",
        widget_config: {
          theme: {
            primaryColor: "#2563eb",
            position: "bottom-right",
            bubbleIcon: "sparkle",
          },
          greeting: "Hello from @botly/tests!",
          placeholder: "Type your query...",
          showBranding: false,
        },
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.name).toBe("Test Package Bot")
    expect(data.org_id).toBe(TEST_ORG_ID)
    expect(data.widget_config.theme.primaryColor).toBe("#2563eb")

    createdBotId = data.id
  })

  it("GET /api/bots lists all bots for the active organization", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const list = await res.json()
    expect(Array.isArray(list)).toBe(true)
    const found = list.find((b: { id: string }) => b.id === createdBotId)
    expect(found).toBeDefined()
    expect(found.name).toBe("Test Package Bot")
  })

  it("GET /api/bots/:botId returns one bot's details", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots/${createdBotId}`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(createdBotId)
    expect(data.name).toBe("Test Package Bot")
  })

  it("PATCH /api/bots/:botId updates bot attributes", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots/${createdBotId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Renamed Package Bot",
        system_prompt: "Updated system prompt.",
      }),
    })

    expect(res.status).toBe(200)
    const updated = await res.json()
    expect(updated.name).toBe("Renamed Package Bot")
    expect(updated.system_prompt).toBe("Updated system prompt.")
  })

  it("GET /api/bots/:botId/embed-snippet returns copy-paste script tag", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/bots/${createdBotId}/embed-snippet`,
      {
        headers: authHeaders,
      }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.botId).toBe(createdBotId)
    expect(data.snippet).toContain(createdBotId)
    expect(data.snippet).toContain("/widget.js")
  })

  it("DELETE /api/bots/:botId removes bot and cascades to documents", async () => {
    const [doc] = await db
      .insert(documents)
      .values({
        botId: createdBotId,
        filename: "cascade-package-test.txt",
        sourceType: "text",
        status: "ready",
      })
      .returning()

    const res = await fetch(`${getBaseUrl()}/api/bots/${createdBotId}`, {
      method: "DELETE",
      headers: authHeaders,
    })
    expect(res.status).toBe(204)

    // Verify bot is deleted from DB
    const [botCheck] = await db
      .select()
      .from(bots)
      .where(eq(bots.id, createdBotId))
    expect(botCheck).toBeUndefined()

    // Verify document was cascade deleted
    const [docCheck] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, doc.id))
    expect(docCheck).toBeUndefined()
  })
})
