import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { startTestServer, stopTestServer, getBaseUrl } from "./setup"
import { db } from "db"
import { bots, documents } from "db/schema"
import { eq } from "drizzle-orm"

describe("Internal Worker Endpoints", () => {
  let botId = ""
  let docId = ""

  beforeAll(async () => {
    await startTestServer()

    const [bot] = await db
      .insert(bots)
      .values({
        orgId: "org_internal_pkg_test",
        name: "Internal Package Test Bot",
      })
      .returning()
    botId = bot.id

    const [doc] = await db
      .insert(documents)
      .values({
        botId,
        filename: "test-doc.txt",
        sourceType: "text",
        status: "processing",
      })
      .returning()
    docId = doc.id
  })

  afterAll(async () => {
    await db.delete(bots).where(eq(bots.id, botId))
    await stopTestServer()
  })

  it("PATCH /internal/documents/:docId/status without secret returns 401 Unauthorized", async () => {
    const res = await fetch(`${getBaseUrl()}/internal/documents/${docId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    })

    expect(res.status).toBe(401)
  })

  it("PATCH /internal/documents/:docId/status with valid secret updates document status", async () => {
    const res = await fetch(`${getBaseUrl()}/internal/documents/${docId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": "dev-botly-internal-secret-key-32chars",
      },
      body: JSON.stringify({ status: "ready" }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.status).toBe("ready")

    const [doc] = await db.select().from(documents).where(eq(documents.id, docId))
    expect(doc.status).toBe("ready")
  })
})
