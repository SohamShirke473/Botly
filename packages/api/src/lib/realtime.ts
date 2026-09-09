import type { Server as HttpServer } from "node:http"
import { WebSocketServer, WebSocket } from "ws"
import type { Response } from "express"
import { logger } from "./logger"
import { db } from "db"
import { messages, conversations, tickets } from "db/schema"
import { eq } from "drizzle-orm"

// ─── 1. Visitor SSE Stream Registry ──────────────────────────────────────────
// Keeps track of open SSE Response objects for each active visitor conversation
const visitorStreams = new Map<string, Set<Response>>()

export function registerVisitorStream(
  conversationId: string,
  res: Response
): () => void {
  let set = visitorStreams.get(conversationId)
  if (!set) {
    set = new Set()
    visitorStreams.set(conversationId, set)
  }
  set.add(res)
  logger.info(
    { conversationId, count: set.size },
    "[Realtime] Visitor SSE client registered"
  )

  return () => {
    set.delete(res)
    if (set.size === 0) {
      visitorStreams.delete(conversationId)
    }
    logger.info(
      { conversationId, remaining: set.size },
      "[Realtime] Visitor SSE client disconnected"
    )
  }
}

export function pushToVisitor(
  conversationId: string,
  event: string,
  data: unknown
): void {
  const set = visitorStreams.get(conversationId)
  if (!set || set.size === 0) return

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of set) {
    try {
      res.write(payload)
      // flush if compression/buffering is enabled
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (res as any).flush === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(res as any).flush()
      }
    } catch (err) {
      logger.warn(
        { err, conversationId },
        "[Realtime] Error writing to visitor SSE stream"
      )
    }
  }
}

// ─── 2. Admin WebSocket Server ───────────────────────────────────────────────
interface AdminClient {
  ws: WebSocket
  orgId?: string
  agentId?: string
  agentName?: string
  subscribedConvoId?: string
  isAlive: boolean
}

const adminClients = new Set<AdminClient>()

export function broadcastToOrg(
  orgId: string,
  event: { type: string; payload: unknown }
): void {
  const msg = JSON.stringify(event)
  for (const client of adminClients) {
    if (client.orgId === orgId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(msg)
      } catch (err) {
        logger.warn(
          { err, orgId },
          "[Realtime] Failed to send WS message to admin client"
        )
      }
    }
  }
}

export function broadcastToConversation(
  conversationId: string,
  event: { type: string; payload: unknown }
): void {
  const msg = JSON.stringify(event)
  for (const client of adminClients) {
    if (
      client.subscribedConvoId === conversationId &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      try {
        client.ws.send(msg)
      } catch (err) {
        logger.warn(
          { err, conversationId },
          "[Realtime] Failed to send WS message to convo subscriber"
        )
      }
    }
  }
}

export function initAdminWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: "/ws/admin",
  })

  wss.on("connection", (ws: WebSocket) => {
    const client: AdminClient = {
      ws,
      isAlive: true,
    }
    adminClients.add(client)
    logger.info(
      { activeAdmins: adminClients.size },
      "[Realtime] Admin WS connected"
    )

    ws.on("pong", () => {
      client.isAlive = true
    })

    ws.on("message", async (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString())

        switch (data.type) {
          case "auth": {
            client.orgId = data.orgId
            client.agentId = data.agentId
            client.agentName = data.agentName || "Agent"
            ws.send(
              JSON.stringify({ type: "authenticated", orgId: client.orgId })
            )
            break
          }

          case "subscribe": {
            client.subscribedConvoId = data.conversationId
            ws.send(
              JSON.stringify({
                type: "subscribed",
                conversationId: client.subscribedConvoId,
              })
            )
            break
          }

          case "unsubscribe": {
            client.subscribedConvoId = undefined
            break
          }

          case "agent_message": {
            const { conversationId, content } = data
            if (!conversationId || !content?.trim()) return

            const [insertedMsg] = await db
              .insert(messages)
              .values({
                conversationId,
                role: "agent",
                content: content.trim(),
                isHuman: true,
                senderName: client.agentName || "Support Agent",
                senderId: client.agentId || null,
              })
              .returning()

            // Update conversation and ticket status to active with agent
            await db
              .update(conversations)
              .set({
                status: "agent_active",
                lastMessageAt: new Date(),
                assignedTo: client.agentId || null,
                assignedAgentId: client.agentId || null,
                updatedAt: new Date(),
              })
              .where(eq(conversations.id, conversationId))

            await db
              .update(tickets)
              .set({
                status: "in_progress",
                assignedTo: client.agentId || null,
                assignedToName: client.agentName || null,
                updatedAt: new Date(),
              })
              .where(eq(tickets.conversationId, conversationId))

            const formattedMsg = {
              id: insertedMsg.id,
              conversation_id: insertedMsg.conversationId,
              role: insertedMsg.role,
              content: insertedMsg.content,
              is_human: true,
              sender_name: client.agentName,
              created_at: insertedMsg.createdAt.toISOString(),
            }

            // 1. Push to visitor SSE stream
            pushToVisitor(conversationId, "agent_message", formattedMsg)

            // 2. Broadcast to other dashboard tabs subscribed to this convo
            broadcastToConversation(conversationId, {
              type: "message:new",
              payload: formattedMsg,
            })

            // 3. Notify org of activity
            if (client.orgId) {
              broadcastToOrg(client.orgId, {
                type: "conversation:updated",
                payload: {
                  conversationId,
                  status: "agent_active",
                  lastMessage: content.trim(),
                },
              })
            }
            break
          }

          case "typing": {
            const { conversationId, isTyping } = data
            if (!conversationId) return
            pushToVisitor(conversationId, "agent_typing", {
              isTyping: !!isTyping,
              agentName: client.agentName,
            })
            break
          }
        }
      } catch (err) {
        logger.warn({ err }, "[Realtime] Failed to parse admin WS message")
      }
    })

    ws.on("close", () => {
      adminClients.delete(client)
      logger.info(
        { remainingAdmins: adminClients.size },
        "[Realtime] Admin WS disconnected"
      )
    })

    ws.on("error", (err) => {
      logger.error({ err }, "[Realtime] Admin WS error")
      adminClients.delete(client)
    })
  })

  // Heartbeat ping interval to detect dead sockets
  const interval = setInterval(() => {
    for (const client of adminClients) {
      if (!client.isAlive) {
        client.ws.terminate()
        adminClients.delete(client)
        continue
      }
      client.isAlive = false
      client.ws.ping()
    }
  }, 30000)

  wss.on("close", () => {
    clearInterval(interval)
  })

  logger.info("🔌 Admin WebSocket Server mounted at /ws/admin")
  return wss
}
