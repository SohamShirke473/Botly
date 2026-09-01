import { z } from "zod"

// Re-export zod so consumers have a consistent zod instance
export { z }

// 1. Health check schema & types
export const HealthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
})

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>

// 2. Message response schema & types
export const MessageResponseSchema = z.object({
  message: z.string(),
})

export type MessageResponse = z.infer<typeof MessageResponseSchema>

// 3. User schema & types (sample DTO)
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  createdAt: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true })
export type CreateUserInput = z.infer<typeof CreateUserSchema>

// 4. Standard API error response
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>

// ─── Botly Domain Types ─────────────────────────────────────────────

// Widget config — stored as JSONB on the bots table
export const WidgetConfigSchema = z.object({
  theme: z.object({
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
    position: z.enum(["bottom-right", "bottom-left"]),
    bubbleIcon: z.enum(["chat", "message", "sparkle"]),
  }),
  greeting: z.string().min(1).max(200),
  placeholder: z.string().min(1).max(100),
  showBranding: z.boolean(),
})

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  theme: {
    primaryColor: "#171717",
    position: "bottom-right",
    bubbleIcon: "chat",
  },
  greeting: "Hi! Ask me anything about our product.",
  placeholder: "Type your question...",
  showBranding: true,
}

// Document status enum
export const DocumentStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "failed",
])
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

// Source type enum
export const SourceTypeSchema = z.enum(["pdf", "text", "url"])
export type SourceType = z.infer<typeof SourceTypeSchema>

// Bot
export const BotSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  name: z.string(),
  system_prompt: z.string().nullable(),
  widget_config: WidgetConfigSchema.nullable(),
  created_at: z.string(),
})

export type Bot = z.infer<typeof BotSchema>

export const CreateBotSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  system_prompt: z.string().optional(),
})

export type CreateBotInput = z.infer<typeof CreateBotSchema>

// Document
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  bot_id: z.string().uuid(),
  filename: z.string(),
  source_type: SourceTypeSchema,
  status: DocumentStatusSchema,
  chunk_count: z.number().optional(),
  created_at: z.string(),
})

export type Document = z.infer<typeof DocumentSchema>

// Conversation
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  bot_id: z.string().uuid(),
  visitor_id: z.string(),
  created_at: z.string(),
  last_message: z.string().optional(),
  message_count: z.number().optional(),
})

export type Conversation = z.infer<typeof ConversationSchema>

// Message
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  created_at: z.string(),
})

export type Message = z.infer<typeof MessageSchema>
