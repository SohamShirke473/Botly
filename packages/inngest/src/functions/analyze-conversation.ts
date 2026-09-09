import { inngest } from "../client"
import { db } from "db"
import { bots, conversations, messages, tickets } from "db/schema"
import { eq, desc } from "drizzle-orm"
import { generateText } from "@botly/ai"

export interface TurnCompletedPayload {
  botId: string
  conversationId: string
  userMessage: string
  assistantMessage?: string
  visitorId: string
}

const HUMAN_REQUEST_REGEX =
  /\b(human|agent|representative|real person|person|support team|talk to someone|helpdesk|operator|advisor|live support|speak to someone|customer service|connect me)\b/i

const FRUSTRATION_KEYWORDS =
  /\b(frustrated|useless|terrible|broken|horrible|angry|cancel|scam|lawyer|chargeback|hate this|not helping|stop repeating|stupid|awful)\b/i

/**
 * Inngest function: analyzeConversationFunction
 * Triggered asynchronously whenever a user completes a chat turn with the bot.
 * Evaluates sentiment, detects frustration or explicit handoff requests,
 * and automatically creates/escalates tickets for human agents.
 */
export const analyzeConversationFunction = inngest.createFunction(
  {
    id: "analyze-conversation-turn",
    name: "Analyze Conversation Turn & Sentiment",
    triggers: [{ event: "chat/turn.completed" }],
    concurrency: {
      limit: 10,
    },
  },
  async ({ event, step }) => {
    const data = event.data as TurnCompletedPayload
    const { botId, conversationId, userMessage, assistantMessage = "" } = data

    // 1. Fetch recent messages in the conversation for context
    const recentMessages = await step.run(
      "fetch-conversation-history",
      async () => {
        const msgs = await db
          .select({
            role: messages.role,
            content: messages.content,
          })
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(desc(messages.createdAt))
          .limit(6)

        return msgs.reverse()
      }
    )

    // 2. Perform AI / rule-based sentiment and intent analysis
    const analysis = await step.run(
      "analyze-sentiment-and-intent",
      async () => {
        const explicitHumanRequest = HUMAN_REQUEST_REGEX.test(userMessage)
        const explicitFrustration = FRUSTRATION_KEYWORDS.test(userMessage)

        let sentiment: "positive" | "neutral" | "negative" | "frustrated" =
          "neutral"
        let frustrationScore = explicitFrustration ? 80 : 20
        let issueSummary = userMessage.slice(0, 160)

        try {
          const historyText = recentMessages
            .map(
              (m: { role: string; content: string }) =>
                `${m.role === "user" ? "User" : "Bot"}: ${m.content}`
            )
            .join("\n")

          const result = await generateText({
            system:
              "You are a customer support analyzer. Analyze user sentiment, detect frustration, determine if human agent handoff is needed, and write a 1-sentence issue summary. Always output valid JSON only.",
            prompt: `Recent conversation:
${historyText}

Analyze the latest user message: "${userMessage}"
Bot response: "${assistantMessage}"

Return JSON matching this exact structure:
{
  "sentiment": "positive" | "neutral" | "negative" | "frustrated",
  "frustrationScore": number (0 to 100),
  "isAskingForHuman": boolean,
  "summary": string (1 concise sentence explaining the customer's issue)
}`,
          })

          const cleaned = result.text.replace(/```json\n?|\n?```/g, "").trim()
          const parsed = JSON.parse(cleaned)

          if (parsed.sentiment) sentiment = parsed.sentiment
          if (typeof parsed.frustrationScore === "number")
            frustrationScore = parsed.frustrationScore
          if (parsed.summary) issueSummary = parsed.summary
          if (parsed.isAskingForHuman)
            frustrationScore = Math.max(frustrationScore, 75)
        } catch {
          // Fallback to keyword heuristics if LLM JSON parsing fails
          if (explicitFrustration) {
            sentiment = "frustrated"
            frustrationScore = 85
          } else if (explicitHumanRequest) {
            sentiment = "neutral"
            frustrationScore = 70
          }
        }

        const shouldEscalate =
          explicitHumanRequest ||
          frustrationScore >= 70 ||
          sentiment === "frustrated"

        const escalationReason: "visitor_requested" | "ai_frustration" =
          explicitHumanRequest ? "visitor_requested" : "ai_frustration"

        return {
          sentiment,
          frustrationScore,
          shouldEscalate,
          escalationReason,
          issueSummary,
        }
      }
    )

    // 3. Update conversation status & create or escalate support ticket if needed
    if (analysis.shouldEscalate) {
      await step.run("escalate-ticket", async () => {
        // Fetch bot's orgId and conversation info
        const [bot] = await db
          .select({ orgId: bots.orgId })
          .from(bots)
          .where(eq(bots.id, botId))
          .limit(1)

        if (!bot) return

        const [convo] = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId))
          .limit(1)

        if (!convo) return

        // Update conversation to human handoff state
        await db
          .update(conversations)
          .set({
            status: "waiting_agent",
            sentiment: analysis.sentiment,
            isAggressive: analysis.frustrationScore >= 80,
            escalationReason: analysis.escalationReason,
            escalatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId))

        // Check if ticket already exists
        const [existingTicket] = await db
          .select({ id: tickets.id })
          .from(tickets)
          .where(eq(tickets.conversationId, conversationId))
          .limit(1)

        const priority: "low" | "medium" | "high" | "urgent" =
          analysis.frustrationScore >= 85
            ? "urgent"
            : analysis.frustrationScore >= 65
              ? "high"
              : "medium"

        if (existingTicket) {
          await db
            .update(tickets)
            .set({
              priority,
              aiSummary: analysis.issueSummary,
              sentiment: analysis.sentiment,
              updatedAt: new Date(),
            })
            .where(eq(tickets.id, existingTicket.id))
        } else {
          await db.insert(tickets).values({
            orgId: bot.orgId,
            botId,
            conversationId,
            status: "open",
            priority,
            escalationReason: analysis.escalationReason,
            visitorName: convo.visitorName,
            visitorEmail: convo.visitorEmail,
            aiSummary: analysis.issueSummary,
            sentiment: analysis.sentiment,
          })
        }
      })
    } else {
      // Just record the detected sentiment on the conversation
      await step.run("record-sentiment", async () => {
        await db
          .update(conversations)
          .set({
            sentiment: analysis.sentiment,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId))
      })
    }

    return {
      conversationId,
      analysis,
    }
  }
)
