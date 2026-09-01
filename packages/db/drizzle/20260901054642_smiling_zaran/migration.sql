CREATE TYPE "document_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "source_type" AS ENUM('pdf', 'text', 'url');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text,
	"widget_theme" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_id" uuid NOT NULL,
	"bot_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"token_count" integer
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bot_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bot_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"status" "document_status" DEFAULT 'pending'::"document_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bots_org_id_idx" ON "bots" ("org_id");--> statement-breakpoint
CREATE INDEX "chunks_document_id_idx" ON "chunks" ("document_id");--> statement-breakpoint
CREATE INDEX "chunks_bot_id_idx" ON "chunks" ("bot_id");--> statement-breakpoint
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "conversations_bot_id_idx" ON "conversations" ("bot_id");--> statement-breakpoint
CREATE INDEX "documents_bot_id_idx" ON "documents" ("bot_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" ("conversation_id");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_bot_id_bots_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_bot_id_bots_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_bot_id_bots_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id");