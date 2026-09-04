import type { Server as HttpServer } from "node:http"
import { Server } from "socket.io"
import { verifyToken } from "@clerk/express"
import { verifyBotOrgAccess } from "../middleware/auth"
import { botRoom, convoRoom, publishTyping, setRealtimeIO } from "./hub"
import { logger } from "../lib/logger"

interface DashboardAuth {
  token?: string
  testOrgId?: string
  testUserId?: string
}

interface VerifiedAdmin {
  userId: string
  orgId: string
}

async function verifyDashboardAuth(
  auth: DashboardAuth
): Promise<VerifiedAdmin | null> {
  // Test bypass (integration tests only)
  if (
    (process.env.TEST_AUTH_ENABLED === "true" ||
      process.env.NODE_ENV === "test") &&
    auth.testOrgId &&
    auth.testUserId
  ) {
    return { userId: auth.testUserId, orgId: auth.testOrgId }
  }

  if (!auth.token) return null
  try {
    const session = await verifyToken(auth.token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })
    const orgId =
      (session as unknown as { orgId?: string }).orgId ??
      (session as unknown as { org_id?: string }).org_id ??
      null
    const userId = (session as unknown as { sub?: string }).sub ?? null
    if (!userId || !orgId) return null
    return { userId, orgId }
  } catch (err) {
    logger.warn(err, "Socket.IO Clerk verification failed")
    return null
  }
}

export function initRealtimeIO(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  // Bridge hub -> Socket.IO rooms
  setRealtimeIO(io)

  io.use(async (socket, next) => {
    const admin = await verifyDashboardAuth(
      (socket.handshake.auth ?? {}) as DashboardAuth
    )
    if (!admin) return next(new Error("Unauthorized"))
    socket.data.admin = admin as VerifiedAdmin
    next()
  })

  io.on("connection", (socket) => {
    const admin = socket.data.admin as VerifiedAdmin

    socket.on(
      "agent:join",
      async (
        payload: { botId?: string; conversationId?: string },
        ack?: (res: unknown) => void
      ) => {
        try {
          const { botId, conversationId } = payload ?? {}
          if (!botId) {
            ack?.({ ok: false, error: "botId required" })
            return
          }
          const bot = await verifyBotOrgAccess(botId, admin.orgId)
          if (!bot) {
            ack?.({ ok: false, error: "Bot not found or access denied" })
            return
          }
          await socket.join(botRoom(botId))
          if (conversationId) await socket.join(convoRoom(conversationId))
          // Notify room of agent presence (ephemeral)
          socket.to(botRoom(botId)).emit("realtime:event", {
            type: "typing",
            botId,
            conversationId: conversationId ?? "",
            actorId: admin.userId,
          })
          ack?.({ ok: true })
        } catch (err) {
          logger.warn(err, "agent:join failed")
          ack?.({ ok: false, error: "Join failed" })
        }
      }
    )

    socket.on(
      "agent:typing",
      (payload: { botId?: string; conversationId?: string }) => {
        const { botId, conversationId } = payload ?? {}
        if (!botId || !conversationId) return
        publishTyping(botId, conversationId, admin.userId)
      }
    )

    socket.on("disconnect", () => {
      // Presence timeout handled client-side; nothing persisted
    })
  })

  logger.info("Socket.IO realtime plane ready at /socket.io/")
  return io
}
