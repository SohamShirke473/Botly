import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express"
import cors from "cors"
import helmet from "helmet"
import pino from "pino"
import pinoHttp from "pino-http"
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

// 1. Security headers
app.use(helmet())

// 2. CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// 3. HTTP request logging via Pino
app.use(pinoHttp({ logger }))

// 4. Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
