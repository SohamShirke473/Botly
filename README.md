# Botly Monorepo

Bun-powered monorepo with independent packages located under `packages/`.

## Structure

```txt
Botly/
├── package.json          # Root Bun workspace configuration
├── bun.lock              # Unified monorepo lockfile
├── README.md             # Project overview & documentation
└── packages/
    ├── types/            # Shared Zod schemas & TypeScript types
    │   ├── src/index.ts
    │   └── package.json  ("types")
    ├── db/               # Drizzle ORM + Bun SQL + PostgreSQL (pgvector)
    │   ├── src/
    │   │   ├── index.ts  (Drizzle client)
    │   │   └── schema.ts (Database schema)
    │   ├── drizzle.config.ts
    │   └── package.json  ("db")
    ├── web/              # React 19 + Vite + Tailwind CSS v4 + shadcn UI
    │   ├── src/
    │   ├── components.json
    │   ├── vite.config.ts
    │   └── package.json  ("web")
    └── api/              # Express + TypeScript + Pino + Helmet + CORS
        ├── src/
        │   └── index.ts  (Express server entrypoint)
        ├── tsconfig.json
        └── package.json  ("api")
```

---

## Getting Started

### 1. Install Dependencies

Dependencies across all workspaces are hoisted and linked automatically:

```bash
bun install
```

### 2. Run in Development

Run both the frontend (`web`) and backend (`api`) concurrently:

```bash
bun run dev
```

Or run individual packages:

```bash
# Start React + Vite dev server (default: http://localhost:5173)
bun run dev:web

# Start Express + Bun dev server with hot reload (default: http://localhost:3001)
bun run dev:api
```

---

## API Endpoints (`packages/api`)

- `GET /api/health` - Server health check with uptime & timestamp
- `GET /api/message` - Sample message response

### Features

- **TypeScript**: Native Bun runtime execution with type safety
- **Security**: Secured via `helmet` HTTP headers and configured `cors`
- **Logging**: High-performance structured logging via `pino` and `pino-http` (formatted with `pino-pretty` in dev)
- **Lifecycle**: Graceful shutdown on `SIGINT` and `SIGTERM`

---

## Frontend (`packages/web`)

Scaffolded with Vite and shadcn UI (`--preset b0 --template vite`).

### Adding shadcn UI components

To add more shadcn components to `packages/web`, run from the repository root:

```bash
bunx --bun shadcn@latest add <component-name> -c packages/web
```

Example:

```bash
bunx --bun shadcn@latest add dialog -c packages/web
```

---

## Available Monorepo Scripts

| Command                | Description                                        |
| :--------------------- | :------------------------------------------------- |
| `bun run dev`          | Runs both `web` and `api` dev servers concurrently |
| `bun run dev:web`      | Runs the `web` Vite development server             |
| `bun run dev:api`      | Runs the `api` Express server with hot-reload      |
| `bun run build`        | Builds both `web` (Vite) and `api`                 |
| `bun run typecheck`    | Typechecks both `web` and `api` packages           |
| `bun run lint`         | Lints entire monorepo using ESLint 10              |
| `bun run lint:fix`     | Lints and auto-fixes issues                        |
| `bun run format`       | Formats all files using Prettier                   |
| `bun run format:check` | Verifies code formatting style                     |
