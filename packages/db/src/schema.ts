import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  vector,
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
      .references(() => bots.id)
      .notNull(),
    filename: text("filename").notNull(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    status: documentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("documents_bot_id_idx").on(table.botId)]
)

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id)
      .notNull(),
    botId: uuid("bot_id")
      .references(() => bots.id)
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
      .references(() => bots.id)
      .notNull(),
    visitorId: text("visitor_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("conversations_bot_id_idx").on(table.botId)]
)

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id)
      .notNull(),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)]
)
