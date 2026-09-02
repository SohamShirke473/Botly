import { getAuth } from "@clerk/express"
import type { Request, Response, NextFunction } from "express"
import { db } from "db"
import { bots } from "db/schema"
import { eq, and } from "drizzle-orm"
import type { Bot, WidgetConfig } from "types"

export interface OrgAuthContext {
  userId: string
  orgId: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authContext?: OrgAuthContext
    }
  }
}

/**
 * Middleware ensuring the request is authenticated via Clerk and has an active organization selected.
 */
export function requireOrgAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow test mock auth bypass only when explicitly enabled for test runs
  if (process.env.TEST_AUTH_ENABLED === "true" || process.env.NODE_ENV === "test") {
    const testOrgId = req.headers["x-test-org-id"] as string | undefined
    const testUserId = req.headers["x-test-user-id"] as string | undefined
    if (testOrgId && testUserId) {
      req.authContext = { userId: testUserId, orgId: testOrgId }
      return next()
    }
  }

  const { isAuthenticated, userId, orgId } = getAuth(req)

  if (!isAuthenticated || !userId) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required. Please provide a valid Clerk session token.",
    })
    return
  }

  if (!orgId) {
    res.status(403).json({
      error: "Forbidden",
      message: "No active organization selected. Please select an organization in Clerk.",
    })
    return
  }

  req.authContext = { userId, orgId }
  next()
}

/**
 * Verifies that a bot exists and belongs to the given Clerk organization.
 */
export async function verifyBotOrgAccess(
  botId: string,
  orgId: string
) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.orgId, orgId)))
    .limit(1)

  return bot || null
}

/**
 * Maps database bot record to shared Bot DTO format.
 */
export function mapBotToDTO(bot: typeof bots.$inferSelect): Bot {
  return {
    id: bot.id,
    org_id: bot.orgId,
    name: bot.name,
    system_prompt: bot.systemPrompt,
    widget_config: (bot.widgetTheme as WidgetConfig | null) ?? null,
    created_at: bot.createdAt.toISOString(),
  }
}
