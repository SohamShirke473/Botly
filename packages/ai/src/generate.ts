import { generateText as sdkGenerateText } from "ai"
import { mistral, DEFAULT_CHAT_MODEL } from "./client"

export type SdkGenerateTextParams = Parameters<typeof sdkGenerateText>[0]

export type GenerateTextOptions = Omit<SdkGenerateTextParams, "model"> & {
  model?: SdkGenerateTextParams["model"] | string
}

export function generateText(options: GenerateTextOptions) {
  const { model = DEFAULT_CHAT_MODEL, ...rest } = options

  const resolvedModel = typeof model === "string" ? mistral(model) : model

  return sdkGenerateText({
    ...rest,
    model: resolvedModel,
  } as SdkGenerateTextParams)
}
