import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  vector,
  boolean,
} from "drizzle-orm/pg-core"
import { pgEnum } from "drizzle-orm/pg-core"

export const sourceTypeEnum = pgEnum("source_type", ["pdf", "text", "url"])
export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "ready",
  "failed",
])
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "agent",
])
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
])
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
])
export const escalationReasonEnum = pgEnum("escalation_reason", [
  "visitor_requested",
  "ai_frustration",
  "ai_uncertainty",
  "manual",
])

export const bots = pgTable(
  "bots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    systemPrompt: text("system_prompt"),
    widgetTheme: jsonb("widget_theme"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("bots_org_id_idx").on(table.orgId)]
)

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    botId: uuid("bot_id")
      .references(() => bots.id, { onDelete: "cascade" })
      .notNull(),
    filename: text("filename").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    status: documentStatusEnum("status").notNull().default("pending"),
    storageKey: text("storage_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("documents_bot_id_idx").on(table.botId)]
)

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    botId: uuid("bot_id")
      .references(() => bots.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1024 }),
    tokenCount: integer("token_count"),
  },
  (table) => [
    index("chunks_document_id_idx").on(table.documentId),
    index("chunks_bot_id_idx").on(table.botId),
    index("chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
)

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    botId: uuid("bot_id")
      .references(() => bots.id, { onDelete: "cascade" })
      .notNull(),
    visitorId: text("visitor_id").notNull(),
    status: text("status").notNull().default("bot"),
    visitorName: text("visitor_name"),
    visitorEmail: text("visitor_email"),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    sentiment: text("sentiment"),
    isAggressive: boolean("is_aggressive").default(false),
    aggressionReason: text("aggression_reason"),
    assignedTo: text("assigned_to"),
    assignedAgentId: text("assigned_agent_id"),
    escalationReason: text("escalation_reason"),
    escalatedAt: timestamp("escalated_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("conversations_bot_id_idx").on(table.botId),
    index("conversations_status_idx").on(table.status),
  ]
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    isHuman: boolean("is_human").default(false),
    senderName: text("sender_name"),
    senderId: text("sender_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)]
)

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: text("org_id").notNull(),
    botId: uuid("bot_id")
      .references(() => bots.id, { onDelete: "cascade" })
      .notNull(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    status: ticketStatusEnum("status").notNull().default("open"),
    priority: ticketPriorityEnum("priority").notNull().default("medium"),
    escalationReason: escalationReasonEnum("escalation_reason").notNull().default("visitor_requested"),
    visitorName: text("visitor_name"),
    visitorEmail: text("visitor_email"),
    assignedTo: text("assigned_to"),
    assignedToName: text("assigned_to_name"),
    aiSummary: text("ai_summary"),
    sentiment: text("sentiment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tickets_org_id_idx").on(table.orgId),
    index("tickets_bot_id_idx").on(table.botId),
    index("tickets_status_idx").on(table.status),
    index("tickets_conversation_id_idx").on(table.conversationId),
  ]
)

