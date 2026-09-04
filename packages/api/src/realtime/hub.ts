import type { Response } from "express"
import type { RealtimeEvent } from "types"
import { logger } from "../lib/logger"

type SSESubscriber = {
  res: Response
  visitorId: string
}

const sseSubs = new Map<string, Set<SSESubscriber>>()

// Socket.IO server reference (set by realtime/socket.ts to avoid circular deps).
// Uses minimal structural typing so hub stays transport-agnostic.
let ioRef: {
  to: (room: string) => { emit: (event: string, payload: unknown) => void }
} | null = null

export function setRealtimeIO(io: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to: (room: string) => { emit: (event: string, payload: any) => void }
}) {
  ioRef = io
}

export function convoRoom(conversationId: string) {
  return `convo:${conversationId}`
}

export function botRoom(botId: string) {
  return `bot:${botId}`
}

function sseKey(botId: string, conversationId: string) {
  return `${botId}:${conversationId}`
}

/** Register a visitor SSE connection. Returns an unsubscribe fn. */
export function subscribeSSE(
  botId: string,
  conversationId: string,
  res: Response,
  visitorId: string
) {
  const key = sseKey(botId, conversationId)
  let set = sseSubs.get(key)
  if (!set) {
    set = new Set()
    sseSubs.set(key, set)
  }
  const sub: SSESubscriber = { res, visitorId }
  set.add(sub)
  return () => {
    set!.delete(sub)
    if (set!.size === 0) sseSubs.delete(key)
  }
}

function writeSSE(res: Response, event: RealtimeEvent) {
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  } catch (err) {
    logger.warn(err, "Failed to write SSE event")
  }
}

/**
 * Fan out a realtime event to visitor SSE subscribers + admin Socket.IO room.
 * Never throws — realtime must not break the request path.
 */
export function publish(event: RealtimeEvent) {
  try {
    const key = sseKey(event.botId, event.conversationId)
    const subs = sseSubs.get(key)
    if (subs) {
      for (const sub of subs) writeSSE(sub.res, event)
    }
    ioRef?.to(convoRoom(event.conversationId)).emit("realtime:event", event)
    ioRef?.to(botRoom(event.botId)).emit("realtime:event", event)
  } catch (err) {
    logger.warn(err, "Realtime publish failed")
  }
}

/** Broadcast typing indicator (ephemeral, not persisted). */
export function publishTyping(
  botId: string,
  conversationId: string,
  actorId: string
) {
  publish({
    type: "typing",
    botId,
    conversationId,
    actorId,
  })
}
