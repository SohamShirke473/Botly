import {
  embed as sdkEmbed,
  embedMany as sdkEmbedMany,
} from "ai"
import { mistral, DEFAULT_EMBEDDING_MODEL } from "./client"

export type SdkEmbedParams = Parameters<typeof sdkEmbed>[0]
export type SdkEmbedManyParams = Parameters<typeof sdkEmbedMany>[0]

export interface EmbedOptions {
  model?: SdkEmbedParams["model"] | string
  abortSignal?: AbortSignal
  providerOptions?: SdkEmbedParams["providerOptions"]
}

export interface EmbedResult {
  embedding: number[]
  usage?: { tokens: number }
}

export interface EmbedManyResult {
  embeddings: number[][]
  usage?: { tokens: number }
}

export async function embedText(
  text: string,
  options?: EmbedOptions
): Promise<EmbedResult> {
  const model = options?.model ?? DEFAULT_EMBEDDING_MODEL
  const resolvedModel =
    typeof model === "string" ? mistral.embedding(model) : model

  const result = await sdkEmbed({
    model: resolvedModel,
    value: text,
    abortSignal: options?.abortSignal,
    providerOptions: options?.providerOptions,
  })

  return {
    embedding: result.embedding,
    usage: result.usage,
  }
}

export async function embedManyTexts(
  texts: string[],
  options?: EmbedOptions
): Promise<EmbedManyResult> {
  if (texts.length === 0) {
    return { embeddings: [], usage: { tokens: 0 } }
  }

  const model = options?.model ?? DEFAULT_EMBEDDING_MODEL
  const resolvedModel =
    typeof model === "string" ? mistral.embedding(model) : model

  const result = await sdkEmbedMany({
    model: resolvedModel,
    values: texts,
    abortSignal: options?.abortSignal,
    providerOptions: options?.providerOptions,
  })

  return {
    embeddings: result.embeddings,
    usage: result.usage,
  }
}
