import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express"
import path from "node:path"
import fs from "node:fs"
import cors from "cors"
import helmet from "helmet"
import pinoHttp from "pino-http"
import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express"
import { serve } from "inngest/express"
import { inngest, functions } from "@botly/inngest"
import type { HealthCheckResponse, MessageResponse } from "types"

import { botsRouter } from "./routes/bots"
import {
  documentsRouter,
  botDocumentsRouter,
} from "./routes/documents"
import { chatRouter } from "./routes/chat"
import {
  analyticsRouter,
  directConversationsRouter,
} from "./routes/analytics"
import { internalRouter } from "./routes/internal"

import { logger } from "./lib/logger"
export { logger }

const app = express()
const PORT = process.env.PORT || 3001

// Disable ETag caching on dynamic API responses
app.disable("etag")

// 1. Security headers (relaxed for widget script embed)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)

// 2. CORS configuration for dashboard & API routes
// Gated behind CLIENT_ORIGIN in production; wildcard allowed only in development
const isProduction = process.env.NODE_ENV === "production"
const clientOrigin = process.env.CLIENT_ORIGIN

if (isProduction && !clientOrigin) {
  throw new Error("CLIENT_ORIGIN env var is required in production")
}

const allowedOrigins = clientOrigin
  ? clientOrigin.split(",").map((o) => o.trim())
  : []

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like server-to-server, curl, tests)
      if (!origin) return callback(null, true)

      // In development, allow all origins
      if (!isProduction) return callback(null, true)

      // In production, strictly enforce allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-internal-secret"],
  })
)

// 3. HTTP request logging via Pino
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
)

// 4. Standalone Embeddable Widget Script Endpoint
const WIDGET_SCRIPT_PATHS = [
  path.resolve(import.meta.dir, "../../web/public/widget.js"),
  path.resolve(process.cwd(), "packages/web/public/widget.js"),
]

app.get("/widget.js", (_req: Request, res: Response) => {
  for (const widgetPath of WIDGET_SCRIPT_PATHS) {
    if (fs.existsSync(widgetPath)) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8")
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Cache-Control", "public, max-age=3600")
      res.sendFile(widgetPath)
      return
    }
  }

  res.status(404).send("// widget.js not found")
})

// 5. Body parsing
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// 6. Clerk authentication middleware
app.use(clerkMiddleware())

// --- Health & Diagnostic Routes ---

app.get("/api/health", (_req, res) => {
  const data: HealthCheckResponse = {
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
  res.status(200).json(data)
})

app.get("/api/message", (_req, res) => {
  const data: MessageResponse = {
    message: "Hello from Botly API running with Bun & TypeScript!",
  }
  res.status(200).json(data)
})

// --- Inngest Dev Server / Cloud Handler ---
app.use("/api/inngest", serve({ client: inngest, functions }))

// Test route for Inngest
app.get(
  "/api/hello",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await inngest.send({
        name: "test/hello.world",
        data: { email: "test@example.com" },
      })
      res.json({
        message:
          "Event sent! Check Inngest Dev Server at http://localhost:8288",
      })
    } catch (err) {
      next(err)
    }
  }
)

// Clerk Organization diagnostic endpoint
app.get(
  "/api/organization",
  async (req: Request, res: Response): Promise<void> => {
    const { isAuthenticated, userId, orgId, orgRole, orgSlug, orgPermissions } =
      getAuth(req)

    if (!isAuthenticated || !userId) {
      res.status(401).json({ error: "User not authenticated" })
      return
    }

    if (!orgId) {
      res.status(200).json({
        hasActiveOrg: false,
        message: "No active organization selected in current Clerk session",
        userId,
        orgId: null,
        orgRole: null,
        orgSlug: null,
      })
      return
    }

    try {
      const organization = await clerkClient.organizations.getOrganization({
        organizationId: orgId,
      })

      res.json({
        hasActiveOrg: true,
        message: "Active organization retrieved successfully",
        userId,
        orgId,
        orgRole,
        orgSlug,
        orgPermissions: orgPermissions || [],
        organization,
      })
    } catch (err) {
      logger.error(err, "Failed to retrieve organization from Clerk")
      res.status(500).json({ error: "Failed to retrieve organization details" })
    }
  }
)

// --- Domain Route Mounts ---

// Bots CRUD & Embed snippet
app.use("/api/bots", botsRouter)

// Bot-scoped documents: /api/bots/:botId/documents
app.use("/api/bots/:botId/documents", botDocumentsRouter)

// Direct document operations: /api/documents/:docId
app.use("/api/documents", documentsRouter)

// Public Chat / RAG widget routes: /api/chat/:botId
app.use("/api/chat", chatRouter)

// Analytics & Conversations dashboard routes: /api/bots/:botId/conversations & /api/bots/:botId/stats
app.use("/api/bots", analyticsRouter)
app.use("/api/conversations", directConversationsRouter)

// Worker Internal routes: /internal/documents/:docId/status
app.use("/internal", internalRouter)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested route does not exist",
  })
})

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "[API Error]")
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  })
})

// --- Server Lifecycle ---
const server = app.listen(PORT, () => {
  logger.info(`🚀 Botly API Server running on http://localhost:${PORT}`)
  logger.info(`   Health check: http://localhost:${PORT}/api/health`)
  logger.info(`   Widget script: http://localhost:${PORT}/widget.js`)
})

const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Closing HTTP server gracefully...`)
  server.close(() => {
    logger.info("HTTP server closed. Exiting process.")
    process.exit(0)
  })
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

export default app
