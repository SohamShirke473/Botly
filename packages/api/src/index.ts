import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express"
import cors from "cors"
import helmet from "helmet"
import pino from "pino"
import pinoHttp from "pino-http"
import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express"
import { serve } from "inngest/express"
import { inngest, functions } from "@botly/inngest"
import type { HealthCheckResponse, MessageResponse } from "types"

export const logger = pino(
  process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || "info",
      }
)

const app = express()
const PORT = process.env.PORT || 3001

// Disable ETag caching on dynamic API responses so auth & org state is always fresh
app.disable("etag")

// 1. Security headers
app.use(helmet())

// 2. CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// 3. HTTP request logging via Pino (clean formatting without dumping raw headers)
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

// 4. Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 5. Clerk authentication middleware
app.use(clerkMiddleware())

// --- Routes ---

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const data: HealthCheckResponse = {
    status: "ok",
    service: "api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
  res.status(200).json(data)
})

// Sample greeting endpoint
app.get("/api/message", (_req, res) => {
  const data: MessageResponse = {
    message: "Hello from Express API running with Bun & TypeScript!",
  }
  res.status(200).json(data)
})

// --- Inngest ---

// Serve the Inngest endpoint — Inngest Dev Server (or Cloud) will POST here
app.use("/api/inngest", serve({ client: inngest, functions }))

// Test route: hit GET /api/hello to send a test event to Inngest
app.get(
  "/api/hello",
  async (req: Request, res: Response, next: NextFunction) => {
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

// Protected route (authenticated with Clerk)
const handleProtected = async (req: Request, res: Response): Promise<void> => {
  const { isAuthenticated, userId } = getAuth(req)

  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "User not authenticated" })
    return
  }

  try {
    const user = await clerkClient.users.getUser(userId)
    res.json({
      message: "Authenticated successfully with Clerk",
      userId,
      user,
    })
  } catch (err) {
    logger.error(err, "Failed to retrieve user from Clerk")
    res.status(500).json({ error: "Failed to retrieve user profile" })
  }
}

app.get("/protected", handleProtected)
app.get("/api/protected", handleProtected)

// Organization route (authenticated with Clerk, checks active organization)
const handleOrganization = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { isAuthenticated, userId, orgId, orgRole, orgSlug, orgPermissions } =
    getAuth(req)

  if (!isAuthenticated || !userId) {
    res.status(401).json({ error: "User not authenticated" })
    return
  }

  if (!orgId) {
    res.status(200).json({
      hasActiveOrg: false,
      message: "No active organization selected in the current Clerk session",
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

app.get("/organization", handleOrganization)
app.get("/api/organization", handleOrganization)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested route does not exist",
  })
})

// Global error handling middleware
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
  logger.info(`🚀 API Server running on http://localhost:${PORT}`)
  logger.info(`   Health check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
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
