import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth, useUser } from "@clerk/react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface UseAdminWsOptions {
  conversationId?: string
  onMessageReceived?: (message: unknown) => void
}

export function useAdminWs(options: UseAdminWsOptions = {}) {
  const { conversationId, onMessageReceived } = options
  const { orgId } = useAuth()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!orgId) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws/admin`

    try {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        setIsConnected(true)
        // Authenticate with organization and agent info
        socket.send(
          JSON.stringify({
            type: "auth",
            orgId,
            agentId: user?.id,
            agentName: user?.fullName || user?.firstName || "Support Agent",
          })
        )

        // If watching a specific conversation, subscribe immediately
        if (conversationId) {
          socket.send(
            JSON.stringify({
              type: "subscribe",
              conversationId,
            })
          )
        }
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case "message:new": {
              const msg = data.payload
              onMessageReceived?.(msg)

              // Invalidate message and conversation queries
              if (msg.conversation_id) {
                queryClient.invalidateQueries({
                  queryKey: ["messages", msg.conversation_id],
                })
              }
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              queryClient.invalidateQueries({ queryKey: ["tickets"] })
              break
            }

            case "ticket:created": {
              queryClient.invalidateQueries({ queryKey: ["tickets"] })
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              toast.info("New Support Ticket Escalated", {
                description: `Visitor ${data.payload.visitorName || data.payload.visitorEmail || "Guest"} requested human assistance.`,
              })
              break
            }

            case "ticket:updated": {
              queryClient.invalidateQueries({ queryKey: ["tickets"] })
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              if (data.payload?.id) {
                queryClient.invalidateQueries({
                  queryKey: ["ticket", data.payload.id],
                })
              }
              break
            }

            case "conversation:updated": {
              queryClient.invalidateQueries({ queryKey: ["conversations"] })
              queryClient.invalidateQueries({ queryKey: ["tickets"] })
              break
            }
          }
        } catch (err) {
          console.warn("[AdminWS] Failed to parse message:", err)
        }
      }

      socket.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }

      socket.onerror = (err) => {
        console.warn("[AdminWS] Error:", err)
        socket.close()
      }
    } catch (err) {
      console.warn("[AdminWS] Connection failed:", err)
    }
  }, [orgId, user, conversationId, onMessageReceived, queryClient])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  // Update subscription if conversationId changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && conversationId) {
      wsRef.current.send(
        JSON.stringify({
          type: "subscribe",
          conversationId,
        })
      )
    }
  }, [conversationId])

  const sendAgentMessage = useCallback((convoId: string, content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "agent_message",
          conversationId: convoId,
          content,
        })
      )
      return true
    }
    return false
  }, [])

  const sendTyping = useCallback((convoId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          conversationId: convoId,
          isTyping,
        })
      )
    }
  }, [])

  return {
    isConnected,
    sendAgentMessage,
    sendTyping,
  }
}
