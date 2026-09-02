import dns from "node:dns/promises"
import { inngest } from "../client"
import { db } from "db"
import { documents, chunks } from "db/schema"
import { eq } from "drizzle-orm"
import { getFile } from "@botly/storage"
import { parsePdf, chunkText, embedManyTexts } from "@botly/ai"

/**
 * Checks whether an IP address belongs to private, loopback, or link-local ranges.
 */
function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true

  const parts = ip.split(".").map(Number)
  if (parts.length === 4) {
    // 10.0.0.0/8
    if (parts[0] === 10) return true
    // 172.16.0.0/12 (172.16.x.x to 172.31.x.x)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true
    // 169.254.0.0/16 (AWS / GCP / Azure link-local metadata)
    if (parts[0] === 169 && parts[1] === 254) return true
    // Loopback 127.0.0.0/8
    if (parts[0] === 127) return true
    // Current network / broadcast
    if (parts[0] === 0 || parts[0] === 255) return true
  }

  return false
}

/**
 * Validates that a user-provided URL is public and does not point to internal resources (SSRF protection).
 */
export async function validatePublicUrl(urlString: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    throw new Error("Invalid URL format")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http: and https: protocols are permitted")
  }

  const hostname = url.hostname.toLowerCase()

  // Prohibit known local and internal hostnames
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".localhost")
  ) {
    throw new Error(`Access to local/internal hostname '${hostname}' is prohibited`)
  }

  // Check raw IP in hostname if direct IP was specified
  if (isPrivateIp(hostname)) {
    throw new Error("Access to private/link-local IP addresses is prohibited")
  }

  // Resolve hostname and verify resolved IP address
  try {
    const lookup = await dns.lookup(hostname)
    if (isPrivateIp(lookup.address)) {
      throw new Error(
        `Hostname '${hostname}' resolves to private IP '${lookup.address}', which is prohibited`
      )
    }
  } catch (err) {
    throw new Error(`URL validation failed: ${(err as Error).message}`, {
      cause: err,
    })
  }

  return url
}

/**
 * Strips HTML elements, styles, scripts, comments, and decodes HTML entities.
 */
function stripHtml(html: string): string {
  let text = html.replace(/<!--[\s\S]*?-->/g, " ")
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
  text = text.replace(/<[^>]+>/g, " ")
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
  return text.replace(/\s+/g, " ").trim()
}

/**
 * Core document processing logic:
 * Extract text -> Chunk -> Embed -> Insert chunks with pgvector embeddings -> Update status
 */
export async function processDocument(docId: string): Promise<{
  chunkCount: number
}> {
  // 1. Mark status as processing
  await db
    .update(documents)
    .set({ status: "processing" })
    .where(eq(documents.id, docId))

  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, docId))
    .limit(1)

  if (!doc) {
    throw new Error(`Document not found: ${docId}`)
  }

  try {
    let rawText = ""

    if (doc.sourceType === "pdf") {
      if (!doc.storageKey) {
        throw new Error("Missing storage key for PDF document")
      }
      const fileData = await getFile(doc.storageKey)
      const parsed = await parsePdf(fileData.data)
      rawText = parsed.text
    } else if (doc.sourceType === "text") {
      if (!doc.storageKey) {
        throw new Error("Missing storage key for text document")
      }
      const fileData = await getFile(doc.storageKey)
      rawText = new TextDecoder().decode(fileData.data)
    } else if (doc.sourceType === "url") {
      // Validate URL against SSRF before making outbound HTTP request
      const safeUrl = await validatePublicUrl(doc.filename)

      const response = await fetch(safeUrl.toString(), {
        headers: {
          "User-Agent": "Botly-Crawler/1.0",
        },
      })
      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL ${doc.filename}: ${response.status} ${response.statusText}`
        )
      }
      const html = await response.text()
      rawText = stripHtml(html)
    }

    if (!rawText.trim()) {
      // Empty document; clean old chunks and mark ready
      await db.delete(chunks).where(eq(chunks.documentId, docId))
      await db
        .update(documents)
        .set({ status: "ready" })
        .where(eq(documents.id, docId))
      return { chunkCount: 0 }
    }

    // 2. Chunk text
    const textChunks = chunkText(rawText, {
      chunkSize: 800,
      chunkOverlap: 150,
    })

    if (textChunks.length === 0) {
      await db.delete(chunks).where(eq(chunks.documentId, docId))
      await db
        .update(documents)
        .set({ status: "ready" })
        .where(eq(documents.id, docId))
      return { chunkCount: 0 }
    }

    // 3. Generate embeddings (Mistral 1024 dims)
    const chunkContents = textChunks.map((c) => c.content)
    const { embeddings } = await embedManyTexts(chunkContents)

    // 4. Delete existing chunks (if reprocessing) and insert new ones
    await db.delete(chunks).where(eq(chunks.documentId, docId))

    const chunkValues = textChunks.map((c, i) => ({
      documentId: doc.id,
      botId: doc.botId,
      content: c.content,
      embedding: embeddings[i],
      tokenCount: c.tokenCount,
    }))

    // Batch insert chunks in chunks of 50 to avoid SQL parameter limits
    const batchSize = 50
    for (let i = 0; i < chunkValues.length; i += batchSize) {
      const batch = chunkValues.slice(i, i + batchSize)
      await db.insert(chunks).values(batch)
    }

    // 5. Mark status as ready
    await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, docId))

    return { chunkCount: textChunks.length }
  } catch (err) {
    // 6. Mark status as failed on error
    await db
      .update(documents)
      .set({ status: "failed" })
      .where(eq(documents.id, docId))
    throw err
  }
}

/**
 * Inngest function for async background ingestion:
 * Triggered by event: "botly/document.process"
 */
export const processDocumentFunction = inngest.createFunction(
  {
    id: "process-document",
    name: "Process Document",
    triggers: [{ event: "botly/document.process" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { documentId } = event.data as { documentId: string }
    const result = await step.run("extract-chunk-embed", async () => {
      return await processDocument(documentId)
    })

    return {
      success: true,
      documentId,
      chunkCount: result.chunkCount,
    }
  }
)
