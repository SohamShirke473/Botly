import { extractText, getMeta } from "unpdf"

export interface ParsedPdfPage {
  pageNumber: number
  text: string
}

export interface ParsedPdfResult {
  text: string
  totalPages: number
  pages: ParsedPdfPage[]
  info?: Record<string, unknown>
}

function toUint8Array(data: Buffer | Uint8Array | ArrayBuffer): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return new Uint8Array(data)
}

export async function parsePdf(
  data: Buffer | Uint8Array | ArrayBuffer
): Promise<ParsedPdfResult> {
  const binaryData = toUint8Array(data)

  const { totalPages, text: pageTexts } = await extractText(binaryData, {
    mergePages: false,
  })

  let info: Record<string, unknown> | undefined
  try {
    const meta = await getMeta(binaryData)
    info = meta?.info as Record<string, unknown> | undefined
  } catch {
    // metadata is optional
  }

  const pages: ParsedPdfPage[] = (
    Array.isArray(pageTexts) ? pageTexts : [pageTexts]
  ).map((pageText, idx) => ({
    pageNumber: idx + 1,
    text: pageText.trim(),
  }))

  const fullText = pages
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n\n")

  return {
    text: fullText,
    totalPages,
    pages,
    info,
  }
}
