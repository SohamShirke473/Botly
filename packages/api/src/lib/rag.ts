import { db } from "db"
import { chunks } from "db/schema"
import { eq, sql } from "drizzle-orm"

export interface RelevantChunk {
  id: string
  content: string
  similarity: number
}

/**
 * Searches the pgvector chunks table for the most semantically relevant text chunks.
 * Uses cosine distance (<=> operator in pgvector).
 */
export async function findRelevantChunks(
  botId: string,
  queryEmbedding: number[],
  limit = 5
): Promise<RelevantChunk[]> {
  const vectorStr = `[${queryEmbedding.join(",")}]`

  const results = await db
    .select({
      id: chunks.id,
      content: chunks.content,
      similarity: sql<number>`1 - (${chunks.embedding} <=> ${vectorStr}::vector)`,
    })
    .from(chunks)
    .where(eq(chunks.botId, botId))
    .orderBy(sql`${chunks.embedding} <=> ${vectorStr}::vector ASC`)
    .limit(limit)

  // Filter out completely irrelevant chunks (similarity threshold)
  return results.filter((r) => r.similarity > 0.3)
}

/**
 * Assembles the system prompt, retrieved knowledge base context, and chat history
 * into a formatted prompt payload for Mistral.
 */
export function buildRagPrompt(
  systemPrompt: string | null | undefined,
  contextChunks: RelevantChunk[],
  history: { role: "user" | "assistant" | "system"; content: string }[],
  userQuery: string
) {
  const baseSystem =
    systemPrompt?.trim() ||
    "You are a helpful, professional customer support assistant. Answer the visitor's question based strictly on the provided documentation context. If the documentation does not contain enough information to answer accurately, politely state that you do not know and suggest contacting support. Keep your answers concise, clear, and easy to read."

  const contextSection =
    contextChunks.length > 0
      ? `\n\n--- DOCUMENTATION KNOWLEDGE BASE ---\n${contextChunks
          .map((c, i) => `[Source ${i + 1}]:\n${c.content}`)
          .join("\n\n")}\n--- END DOCUMENTATION ---`
      : ""

  const system = `${baseSystem}${contextSection}`

  const messages = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    {
      role: "user" as const,
      content: userQuery,
    },
  ]

  return { system, messages }
}
