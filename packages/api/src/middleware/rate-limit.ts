import rateLimit from "express-rate-limit"

/**
 * Rate limiter for public widget chat routes to protect LLM bills.
 * Keys by botId and visitor IP, allowing 40 requests per minute.
 */
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  keyGenerator: (req) => {
    const botId = req.params.botId || "unknown"
    const clientIp = req.ip || req.socket.remoteAddress || "anonymous"
    return `${botId}_${clientIp}`
  },
  message: {
    error: "Too Many Requests",
    message:
      "Rate limit exceeded for this chatbot. Please wait a moment before sending another message.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
