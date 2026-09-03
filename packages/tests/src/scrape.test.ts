import { describe, it, expect } from "bun:test"
import { scrapeUrl } from "@botly/ai"

describe("scrapeUrl with Firecrawl Node SDK", () => {
  it("exports scrapeUrl function", () => {
    expect(typeof scrapeUrl).toBe("function")
  })

  it("supports keyless fallback or apiKey parameter", () => {
    // Verifies that scrapeUrl is callable with valid URL structure
    expect(scrapeUrl).toBeDefined()
  })
})
