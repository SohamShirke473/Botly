import { streamText as sdkStreamText, type StreamTextResult } from "ai"
import { mistral, DEFAULT_CHAT_MODEL } from "./client"

export type SdkStreamTextParams = Parameters<typeof sdkStreamText>[0]

export type StreamTextOptions = Omit<SdkStreamTextParams, "model"> & {
  model?: SdkStreamTextParams["model"] | string
}

export function streamText(options: StreamTextOptions) {
  const { model = DEFAULT_CHAT_MODEL, ...rest } = options

  const resolvedModel = typeof model === "string" ? mistral(model) : model

  return sdkStreamText({
    ...rest,
    model: resolvedModel,
  } as SdkStreamTextParams)
}

export type { StreamTextResult }
