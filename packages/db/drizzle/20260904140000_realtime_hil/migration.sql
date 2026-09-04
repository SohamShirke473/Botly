-- Realtime + human-in-the-loop migration (idempotent, HIL-only).
-- Apply with: psql "$DATABASE_URL" -f packages/db/drizzle/20260904140000_realtime_hil/migration.sql
-- (or `bun run db:push`, which syncs the same schema).

-- 1. Conversation status enum
DO $$ BEGIN
  CREATE TYPE "conversation_status" AS ENUM('bot', 'queued', 'human', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
-- 2. Agent role for human-agent messages.
-- NOTE: Postgres forbids ALTER TYPE ... ADD VALUE inside a transaction block,
-- so run this statement outside a transaction (psql -f does that per statement).
ALTER TYPE "message_role" ADD VALUE IF NOT EXISTS 'agent';
--> statement-breakpoint
-- 3. Handoff columns on conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "status" "conversation_status" DEFAULT 'bot' NOT NULL;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "assigned_agent_id" text;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "escalation_reason" text;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "escalated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
-- 4. Author tracking on messages (Clerk userId for role='agent')
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "sender_id" text;
