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

// ─── Route Param Validation Schemas ─────────────────────────────────

export const BotIdParamSchema = z.object({
  botId: z.string().uuid("Invalid Bot ID"),
})
export type BotIdParam = z.infer<typeof BotIdParamSchema>

export const DocIdParamSchema = z.object({
  docId: z.string().uuid("Invalid Document ID"),
})
export type DocIdParam = z.infer<typeof DocIdParamSchema>

export const DocumentBotParamSchema = z.object({
  botId: z.string().uuid("Invalid Bot ID"),
  docId: z.string().uuid("Invalid Document ID"),
})
export type DocumentBotParam = z.infer<typeof DocumentBotParamSchema>

export const ConvoIdParamSchema = z.object({
  botId: z.string().uuid("Invalid Bot ID"),
  convoId: z.string().uuid("Invalid Conversation ID"),
})
export type ConvoIdParam = z.infer<typeof ConvoIdParamSchema>

export const SingleConvoIdParamSchema = z.object({
  convoId: z.string().uuid("Invalid Conversation ID"),
})
export type SingleConvoIdParam = z.infer<typeof SingleConvoIdParamSchema>

// ─── Bot Schemas ────────────────────────────────────────────────────

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
  system_prompt: z.string().max(4000).optional(),
  widget_config: WidgetConfigSchema.optional(),
})
export type CreateBotInput = z.infer<typeof CreateBotSchema>

export const UpdateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  system_prompt: z.string().max(4000).nullable().optional(),
  widget_config: WidgetConfigSchema.optional(),
})
export type UpdateBotInput = z.infer<typeof UpdateBotSchema>

// ─── Document Schemas ───────────────────────────────────────────────

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

export const UploadUrlDocumentSchema = z.object({
  url: z.string().url("Must be a valid URL (http/https)"),
})
export type UploadUrlDocumentInput = z.infer<typeof UploadUrlDocumentSchema>

export const DocumentStatusUpdateSchema = z.object({
  status: DocumentStatusSchema,
})
export type DocumentStatusUpdate = z.infer<typeof DocumentStatusUpdateSchema>

// ─── Chat / Conversation Schemas ────────────────────────────────────

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  bot_id: z.string().uuid(),
  visitor_id: z.string(),
  status: z.string().default("bot"),
  visitor_name: z.string().nullable().optional(),
  visitor_email: z.string().nullable().optional(),
  created_at: z.string(),
  last_message: z.string().optional(),
  last_message_at: z.string().optional(),
  message_count: z.number().optional(),
})
export type Conversation = z.infer<typeof ConversationSchema>

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  role: z.enum(["user", "assistant", "system", "agent"]),
  content: z.string(),
  is_human: z.boolean().optional(),
  sender_name: z.string().nullable().optional(),
  created_at: z.string(),
})
export type Message = z.infer<typeof MessageSchema>

// ─── Tickets & Handoff Schemas ──────────────────────────────────────

export const TicketStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
])
export type TicketStatus = z.infer<typeof TicketStatusSchema>

export const TicketPrioritySchema = z.enum(["low", "medium", "high", "urgent"])
export type TicketPriority = z.infer<typeof TicketPrioritySchema>

export const EscalationReasonSchema = z.enum([
  "visitor_requested",
  "ai_frustration",
  "ai_uncertainty",
  "manual",
])
export type EscalationReason = z.infer<typeof EscalationReasonSchema>

export const TicketSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string(),
  bot_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  escalation_reason: EscalationReasonSchema,
  visitor_name: z.string().nullable().optional(),
  visitor_email: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  assigned_to_name: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Joined fields for UI convenience
  bot_name: z.string().optional(),
  last_message: z.string().optional(),
  message_count: z.number().optional(),
})
export type Ticket = z.infer<typeof TicketSchema>

export const UpdateTicketSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  assigned_to: z.string().nullable().optional(),
  assigned_to_name: z.string().nullable().optional(),
})
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>

export const HandoffRequestSchema = z.object({
  visitorName: z.string().max(100).optional(),
  visitorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  reason: z.string().max(300).optional(),
})
export type HandoffRequestInput = z.infer<typeof HandoffRequestSchema>

export const AgentSendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000),
})
export type AgentSendMessageInput = z.infer<typeof AgentSendMessageSchema>

export const StartConversationSchema = z.object({
  visitorId: z.string().min(1, "visitorId is required"),
})
export type StartConversationInput = z.infer<typeof StartConversationSchema>

export const SendChatMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
  visitorId: z.string().min(1, "visitorId is required"),
  message: z.string().min(1, "Message cannot be empty").max(4000),
})
export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>

// ─── Embed & Public Config Schemas ──────────────────────────────────

export const BotPublicConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  widgetConfig: WidgetConfigSchema,
})
export type BotPublicConfig = z.infer<typeof BotPublicConfigSchema>

export const EmbedSnippetResponseSchema = z.object({
  botId: z.string().uuid(),
  snippet: z.string(),
  scriptUrl: z.string(),
})
export type EmbedSnippetResponse = z.infer<typeof EmbedSnippetResponseSchema>

// ─── Analytics / Stats Schemas ──────────────────────────────────────

export const DailyMessageStatSchema = z.object({
  date: z.string(),
  count: z.number(),
})
export type DailyMessageStat = z.infer<typeof DailyMessageStatSchema>

export const BotStatsResponseSchema = z.object({
  totalMessages: z.number(),
  activeConversations: z.number(),
  totalDocuments: z.number(),
  readyDocuments: z.number(),
  totalChunks: z.number(),
  messagesPerDay: z.array(DailyMessageStatSchema),
})
export type BotStatsResponse = z.infer<typeof BotStatsResponseSchema>
