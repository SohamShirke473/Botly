# Botly Monorepo

Botly is an AI-powered customer support chatbot platform built with Bun, Express, React, PostgreSQL (`pgvector`), MinIO / S3, and Mistral AI.

---

## Workspace Structure

```txt
Botly/
├── package.json              # Monorepo scripts & dependencies
├── bun.lock                  # Unified Bun lockfile
├── docker-compose.yml        # PostgreSQL (pgvector) & MinIO S3
└── packages/
    ├── types/                # Shared Zod validation schemas & TypeScript types
    ├── db/                   # Drizzle ORM schema, migrations, and pgvector extension
    ├── ai/                   # Mistral AI streaming, embeddings, text chunking & PDF parser
    ├── storage/              # Shared S3 / MinIO object storage client & helpers
    ├── inngest/              # Inngest background document ingestion pipeline
    ├── api/                  # Express API: Clerk auth, RAG chat streaming, bot management
    ├── web/                  # React 19 + Vite + Tailwind CSS v4 dashboard & embed preview
    └── tests/                # Automated end-to-end integration test suite (bun:test)
```

---

## Infrastructure Services

Start the local database and S3 storage services using Docker Compose:

```bash
# Start PostgreSQL (pgvector) and MinIO
bun run docker:up

# Stop services
bun run docker:down
```

| Service | Endpoint | Credentials / Details |
|---|---|---|
| **PostgreSQL (`pgvector`)** | `localhost:5432` | User: `postgres`, DB: `botly` |
| **MinIO API (S3)** | `http://localhost:9000` | Access/Secret: `minioadmin` / `minioadmin` |
| **MinIO Console** | `http://localhost:9001` | S3 bucket: `botly-documents` |
| **Inngest Dev Server** | `http://localhost:8288` | `npx inngest-cli@latest dev` |

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure your API keys:
- `CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Clerk dashboard authentication
- `MISTRAL_API_KEY`: Mistral AI embeddings and text generation
- `INTERNAL_API_SECRET`: Secret header for internal worker status updates

### 3. Initialize Database Schema

```bash
bun run db:push
```

### 4. Run Development Servers

Run frontend and backend simultaneously:

```bash
bun run dev
```

Or run individual workspaces:

```bash
# Start Vite frontend (http://localhost:5173)
bun run dev:web

# Start Express API server (http://localhost:3001)
bun run dev:api

# Start Inngest dev server
cd packages/inngest && npx inngest-cli@latest dev
```

---

## API Routes & Endpoints

### 1. Bot Management (`packages/api/src/routes/bots.ts`)
*All dashboard routes require Clerk authentication (`Authorization: Bearer <token>`)*

- `POST /api/bots` - Create a bot (name, system prompt, widget theme)
- `GET /api/bots` - List all bots for the active Clerk organization
- `GET /api/bots/:botId` - Get bot configuration and properties
- `PATCH /api/bots/:botId` - Update bot name, prompt, or widget theme
- `DELETE /api/bots/:botId` - Delete bot (cleans up S3 files & cascades in DB)
- `GET /api/bots/:botId/embed-snippet` - Return copy-paste `<script>` embed snippet

### 2. Knowledge Base & Ingestion (`packages/api/src/routes/documents.ts`)
- `POST /api/bots/:botId/documents` - Upload PDF/TXT file (multipart) or submit a URL (JSON)
- `GET /api/bots/:botId/documents` - List documents, ingestion status, and chunk counts
- `GET /api/documents/:docId` - Get single document details
- `POST /api/documents/:docId/reprocess` - Retry or reprocess ingestion
- `DELETE /api/documents/:docId` - Remove document and its S3 object

### 3. Public Widget & Chat (`packages/api/src/routes/chat.ts`)
*Public endpoints accessible by external websites without user login*

- `GET /api/chat/:botId/config` - Retrieve public widget appearance & greetings
- `POST /api/chat/:botId/conversations` - Start a new visitor chat session
- `POST /api/chat/:botId` - Send a message and stream AI response via Server-Sent Events (SSE)
- `GET /api/chat/:botId/conversations/:convoId/messages` - Fetch paginated message history

### 4. Analytics & Transcripts (`packages/api/src/routes/analytics.ts`)
- `GET /api/bots/:botId/conversations` - List visitor sessions with message counts & previews
- `GET /api/bots/:botId/conversations/:convoId` - View full conversation transcript
- `GET /api/bots/:botId/stats` - Engagement stats (total messages, docs, daily activity)
- `GET /api/conversations/:convoId/messages` - Direct conversation message history

### 5. Worker & Internal (`packages/api/src/routes/internal.ts`)
- `PATCH /internal/documents/:docId/status` - Worker status update (secured via `x-internal-secret`)

### 6. Standalone Embed Script
- `GET /widget.js` - Zero-dependency Shadow DOM embeddable chat widget script

---

## Standalone Embed Widget

To add Botly to any website or HTML page:

```html
<script
  src="http://localhost:3001/widget.js"
  data-bot-id="YOUR_BOT_ID"
  async
></script>
```

The script injects a floating chat button and chat drawer via **Shadow DOM**, ensuring 100% style isolation and XSS protection.

---

## Testing & Quality Assurance

The test suite runs with Bun's native test runner (`bun:test`):

```bash
# Run all end-to-end integration tests
bun run test:api

# Run TypeScript typechecks across all 8 workspaces
bun run typecheck

# Run ESLint across the monorepo
bun run lint
```

---

## Monorepo Scripts Reference

| Command | Description |
|---|---|
| `bun run dev` | Runs `web` (5173) and `api` (3001) concurrently |
| `bun run dev:web` | Starts the Vite React dashboard |
| `bun run dev:api` | Starts the Express API server with hot-reload |
| `bun run test:api` | Runs the `@botly/tests` suite (26 integration tests) |
| `bun run build` | Builds both `web` and `api` bundles for production |
| `bun run typecheck` | Typechecks all 8 workspaces without emitting files |
| `bun run lint` | Lints the monorepo using ESLint |
| `bun run lint:fix` | Automatically fixes auto-fixable lint issues |
| `bun run format` | Formats code with Prettier |
| `bun run db:push` | Synchronizes Drizzle schema with PostgreSQL |
| `bun run db:studio` | Launches Drizzle Studio GUI for database inspection |
| `bun run docker:up` | Launches PostgreSQL (`pgvector`) and MinIO containers |
| `bun run docker:down` | Stops Docker Compose infrastructure services |
