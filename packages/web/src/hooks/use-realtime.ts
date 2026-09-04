import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/react"
import { io, type Socket } from "socket.io-client"
import type { RealtimeEvent } from "types"

const baseUrl = import.meta.env.VITE_API_URL || ""

/**
 * Admin realtime connection (Socket.IO).
 * Joins bot room + active conversation room; invalidates transcript caches on events.
 * Visitor/widget side stays SSE-only — this hook is dashboard-only.
 */
export function useRealtimeInbox(botId: string | undefined, conversationId: string | null) {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [typingFrom, setTypingFrom] = useState<string | null>(null)

  useEffect(() => {
    if (!botId) return
    let cancelled = false
    let socket: Socket | null = null

    ;(async () => {
      const token = await getToken()
      if (cancelled) return
      socket = io(baseUrl || window.location.origin, {
        path: "/socket.io/",
        auth: { token },
        transports: ["websocket", "polling"],
      })
      socketRef.current = socket

      socket.on("connect", () => {
        setConnected(true)
        socket?.emit("agent:join", { botId, conversationId }, () => {})
      })
      socket.on("disconnect", () => setConnected(false))
      socket.on("realtime:event", (event: RealtimeEvent) => {
        if (event.botId !== botId) return
        if (event.type === "typing") {
          setTypingFrom(event.actorId ?? "agent")
          window.setTimeout(() => setTypingFrom(null), 3000)
          return
        }
        // Live inbox refresh
        queryClient.invalidateQueries({ queryKey: ["conversations", botId] })
        if (event.conversationId) {
          queryClient.invalidateQueries({ queryKey: ["messages", event.conversationId] })
        }
      })
    })()

    return () => {
      cancelled = true
      socket?.disconnect()
      socketRef.current = null
    }
    // Re-join when active conversation changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, conversationId])

  const sendTyping = (convoId: string) => {
    socketRef.current?.emit("agent:typing", { botId, conversationId: convoId })
  }

  return { connected, typingFrom, sendTyping }
}
