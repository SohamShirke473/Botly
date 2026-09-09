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

describe("Documents & Ingestion Routes", () => {
  let botId = ""
  let uploadedDocId = ""
  let urlDocId = ""

  beforeAll(async () => {
    await startTestServer()

    const [bot] = await db
      .insert(bots)
      .values({
        orgId: TEST_ORG_ID,
        name: "Docs Package Test Bot",
        systemPrompt: "Bot for document testing",
      })
      .returning()
    botId = bot.id
  })

  afterAll(async () => {
    await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("POST /api/bots/:botId/documents uploads a text file via multipart form", async () => {
    const formData = new FormData()
    const blob = new Blob(
      ["Documentation snippet: API rate limit is 100 requests per minute."],
      {
        type: "text/plain",
      }
    )
    formData.append("file", blob, "limits.txt")

    const res = await fetch(`${getBaseUrl()}/api/bots/${botId}/documents`, {
      method: "POST",
      headers: {
        "x-test-org-id": TEST_ORG_ID,
        "x-test-user-id": "user_doc_test",
      },
      body: formData,
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.filename).toBe("limits.txt")
    expect(data.source_type).toBe("text")
    expect(data.status).toBe("pending")

    uploadedDocId = data.id
  })

  it("POST /api/bots/:botId/documents ingests a URL source", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots/${botId}/documents`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        url: "https://example.com/api-docs",
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBeDefined()
    expect(data.source_type).toBe("url")
    expect(data.filename).toBe("https://example.com/api-docs")

    urlDocId = data.id
  })

  it("GET /api/bots/:botId/documents lists all documents for the bot", async () => {
    const res = await fetch(`${getBaseUrl()}/api/bots/${botId}/documents`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const list = await res.json()
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThanOrEqual(2)
  })

  it("GET /api/documents/:docId retrieves a single document's details", async () => {
    const res = await fetch(`${getBaseUrl()}/api/documents/${uploadedDocId}`, {
      headers: authHeaders,
    })

    expect(res.status).toBe(200)
    const doc = await res.json()
    expect(doc.id).toBe(uploadedDocId)
    expect(doc.filename).toBe("limits.txt")
  })

  it("POST /api/documents/:docId/reprocess triggers reprocessing", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/documents/${uploadedDocId}/reprocess`,
      {
        method: "POST",
        headers: authHeaders,
      }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe("pending")
  })

  it("DELETE /api/documents/:docId deletes the document", async () => {
    const res = await fetch(`${getBaseUrl()}/api/documents/${urlDocId}`, {
      method: "DELETE",
      headers: authHeaders,
    })

    expect(res.status).toBe(204)
    const [check] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, urlDocId))
    expect(check).toBeUndefined()
  })
})
