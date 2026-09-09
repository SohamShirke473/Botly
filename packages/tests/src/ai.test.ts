import { describe, it, expect } from "bun:test"
import {
  chunkText,
  embedText,
  embedManyTexts,
  streamText,
  generateText,
  DEFAULT_CHAT_MODEL,
  DEFAULT_EMBEDDING_MODEL,
  MISTRAL_EMBED_DIMENSIONS,
  scrapeUrl,
} from "@botly/ai"

describe("@botly/ai - Chunking", () => {
  it("returns an empty array for empty or whitespace text", () => {
    expect(chunkText("")).toEqual([])
    expect(chunkText("   \n\t  ")).toEqual([])
  })

  it("chunks text into segments with token counts and offsets", () => {
    const text =
      "Antigravity is an advanced coding agent. It helps developers write code, run tests, and debug issues. Fast and reliable pairing."
    const chunks = chunkText(text, { chunkSize: 60, chunkOverlap: 15 })

    expect(chunks.length).toBeGreaterThanOrEqual(2)
    for (const chunk of chunks) {
      expect(chunk.content.length).toBeGreaterThan(0)
      expect(chunk.tokenCount).toBeGreaterThan(0)
      expect(typeof chunk.charStart).toBe("number")
      expect(typeof chunk.charEnd).toBe("number")
      expect(chunk.charEnd).toBeGreaterThan(chunk.charStart)
    }
  })

  it("handles text smaller than the chunk size as a single chunk", () => {
    const text = "Short single sentence."
    const chunks = chunkText(text, { chunkSize: 200 })

    expect(chunks.length).toBe(1)
    expect(chunks[0].content).toBe(text)
    expect(chunks[0].index).toBe(0)
  })
})

describe("@botly/ai - Client & Constants", () => {
  it("exports expected default models and embedding dimensions", () => {
    expect(DEFAULT_CHAT_MODEL).toBe("open-mistral-nemo")
    expect(DEFAULT_EMBEDDING_MODEL).toBe("mistral-embed")
    expect(MISTRAL_EMBED_DIMENSIONS).toBe(1024)
  })
})

describe("@botly/ai - Embeddings (Mistral)", () => {
  it("embedManyTexts returns empty array for empty input", async () => {
    const res = await embedManyTexts([])
    expect(res.embeddings).toEqual([])
    expect(res.usage?.tokens).toBe(0)
  })

  it("generates 1024-dimensional embeddings for a text string", async () => {
    if (!process.env.MISTRAL_API_KEY) {
      console.warn("Skipping live embedding test: MISTRAL_API_KEY missing")
      return
    }

    const res = await embedText("Testing Mistral AI embeddings")
    expect(res.embedding).toBeDefined()
    expect(Array.isArray(res.embedding)).toBe(true)
    expect(res.embedding.length).toBe(MISTRAL_EMBED_DIMENSIONS)
  })

  it("embedManyTexts generates embeddings for multiple strings", async () => {
    if (!process.env.MISTRAL_API_KEY) {
      console.warn("Skipping live embedding batch test: MISTRAL_API_KEY missing")
      return
    }

    const res = await embedManyTexts(["First test document", "Second test document"])
    expect(res.embeddings.length).toBe(2)
    expect(res.embeddings[0].length).toBe(MISTRAL_EMBED_DIMENSIONS)
    expect(res.embeddings[1].length).toBe(MISTRAL_EMBED_DIMENSIONS)
  })
})

describe("@botly/ai - Streaming (Mistral)", () => {
  it("streams response tokens using streamText", async () => {
    if (!process.env.MISTRAL_API_KEY) {
      console.warn("Skipping live streamText test: MISTRAL_API_KEY missing")
      return
    }

    const result = streamText({
      prompt: "Respond with the single word: Pong",
    })

    let fullText = ""
    for await (const chunk of result.textStream) {
      fullText += chunk
    }

    expect(fullText.toLowerCase()).toContain("pong")
  })
})

describe("@botly/ai - PDF Parsing (unpdf)", () => {
  it("parses text and pages from a PDF buffer", async () => {
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 24 Tf 100 700 Td (Hello PDF World) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer << /Root 1 0 R /Size 5 >>
startxref
300
%%EOF`

    const { parsePdf } = await import("@botly/ai")
    const result = await parsePdf(Buffer.from(minimalPdf))

    expect(result.totalPages).toBe(1)
    expect(result.text).toContain("Hello PDF World")
    expect(result.pages.length).toBe(1)
    expect(result.pages[0].pageNumber).toBe(1)
  })
})

describe("@botly/ai - Web Scraping (Firecrawl)", () => {
  it("exports scrapeUrl function", () => {
    expect(typeof scrapeUrl).toBe("function")
  })
})

describe("@botly/ai - Text Generation (Gemini)", () => {
  it("generates text from prompt using generateText", async () => {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping live generateText test: GEMINI_API_KEY missing")
      return
    }

    const { text, usage } = await generateText({
      prompt: "Reply with the single word: OK",
    })

    expect(text).toBeDefined()
    expect(typeof text).toBe("string")
    expect(text.trim().toLowerCase()).toContain("ok")
    if (usage) {
      expect(usage.totalTokens).toBeGreaterThan(0)
    }
  })
})
