import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { startTestServer, stopTestServer, getBaseUrl } from "./setup"

describe("Health & Static Widget Endpoints", () => {
  beforeAll(async () => {
    await startTestServer()
  })

  afterAll(async () => {
    await stopTestServer()
  })

  it("GET /api/health returns 200 OK", async () => {
    const res = await fetch(`${getBaseUrl()}/api/health`)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe("ok")
    expect(data.timestamp).toBeDefined()
  })

  it("GET /widget.js returns standalone javascript bundle with Shadow DOM", async () => {
    const res = await fetch(`${getBaseUrl()}/widget.js`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toContain("application/javascript")

    const content = await res.text()
    expect(content).toContain("botly-widget-host")
    expect(content).toContain("attachShadow")
    expect(content).toContain("escapeHtml")
  })
})
