export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

export interface TextChunk {
  content: string
  index: number
  charStart: number
  charEnd: number
  tokenCount: number
}

function splitText(text: string, separators: string[], chunkSize: number): string[] {
  if (text.length <= chunkSize) return [text]

  let sep = separators[separators.length - 1]
  for (const s of separators) {
    if (s === "" || text.includes(s)) {
      sep = s
      break
    }
  }

  const parts = sep === "" ? Array.from(text) : text.split(sep)
  const nextSeparators = separators.slice(separators.indexOf(sep) + 1)

  const result: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (part.length > chunkSize && nextSeparators.length > 0) {
      result.push(...splitText(part, nextSeparators, chunkSize))
    } else {
      result.push(part)
    }
  }
  return result
}

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  if (!text || !text.trim()) return []

  const rawText = text.trim()
  const chunkSize = Math.max(50, options.chunkSize ?? 800)
  const chunkOverlap = Math.min(Math.floor(chunkSize / 2), Math.max(0, options.chunkOverlap ?? 150))
  const separators = options.separators ?? ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

  const splits = splitText(rawText, separators, chunkSize)
  const chunks: string[] = []
  let currentGroup: string[] = []
  let currentLength = 0

  for (const split of splits) {
    const splitLen = split.length
    const sepLen = currentGroup.length > 0 ? 1 : 0

    if (currentLength + sepLen + splitLen > chunkSize && currentGroup.length > 0) {
      const merged = currentGroup.join(" ").trim()
      if (merged) chunks.push(merged)

      while (currentLength > chunkOverlap && currentGroup.length > 1) {
        const removed = currentGroup.shift()!
        currentLength -= removed.length + 1
      }
    }

    currentGroup.push(split)
    currentLength += splitLen + (currentGroup.length > 1 ? 1 : 0)
  }

  if (currentGroup.length > 0) {
    const last = currentGroup.join(" ").trim()
    if (last) chunks.push(last)
  }

  let cursor = 0
  return chunks.map((content, index) => {
    let charStart = rawText.indexOf(content, cursor)
    if (charStart === -1) charStart = rawText.indexOf(content)
    if (charStart === -1) charStart = cursor

    const charEnd = charStart + content.length
    cursor = Math.max(cursor, charStart + 1)

    return {
      content,
      index,
      charStart,
      charEnd,
      tokenCount: Math.max(1, Math.ceil(content.length / 4)),
    }
  })
}
