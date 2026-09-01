import { createMistral } from "@ai-sdk/mistral"

export const DEFAULT_CHAT_MODEL = "mistral-small-latest" as const
export const DEFAULT_EMBEDDING_MODEL = "mistral-embed" as const
export const MISTRAL_EMBED_DIMENSIONS = 1024 as const

export const mistral = createMistral()

export { createMistral }
