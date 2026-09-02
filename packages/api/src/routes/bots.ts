import { Router, type Request, type Response } from "express"
import { db } from "db"
import { bots, documents } from "db/schema"
import { eq, desc } from "drizzle-orm"
import {
  requireOrgAuth,
  verifyBotOrgAccess,
  mapBotToDTO,
} from "../middleware/auth"
import { validate } from "../middleware/validate"
import { deleteFile } from "@botly/storage"
import { logger } from "../lib/logger"
import {
  CreateBotSchema,
  UpdateBotSchema,
  BotIdParamSchema,
  DEFAULT_WIDGET_CONFIG,
  type EmbedSnippetResponse,
} from "types"

export const botsRouter = Router()

// Apply organization authentication to all /api/bots routes
botsRouter.use(requireOrgAuth)

/**
 * POST /api/bots
 * Create a new bot for the active organization
 */
botsRouter.post(
  "/",
  validate({ body: CreateBotSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { name, system_prompt, widget_config } = req.body

    const [newBot] = await db
      .insert(bots)
      .values({
        orgId,
        name,
        systemPrompt: system_prompt ?? null,
        widgetTheme: widget_config ?? DEFAULT_WIDGET_CONFIG,
      })
      .returning()

    res.status(201).json(mapBotToDTO(newBot))
  }
)

/**
 * GET /api/bots
 * List all bots for the active organization
 */
botsRouter.get("/", async (req: Request, res: Response) => {
  const { orgId } = req.authContext!

  const orgBots = await db
    .select()
    .from(bots)
    .where(eq(bots.orgId, orgId))
    .orderBy(desc(bots.createdAt))

  res.json(orgBots.map(mapBotToDTO))
})

/**
 * GET /api/bots/:botId
 * Get one bot's details
 */
botsRouter.get(
  "/:botId",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { botId } = req.params as { botId: string }

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    res.json(mapBotToDTO(bot))
  }
)

/**
 * PATCH /api/bots/:botId
 * Update name, system prompt, or widget config
 */
botsRouter.patch(
  "/:botId",
  validate({ params: BotIdParamSchema, body: UpdateBotSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { botId } = req.params as { botId: string }
    const { name, system_prompt, widget_config } = req.body

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const updates: Partial<typeof bots.$inferInsert> = {}
    if (name !== undefined) updates.name = name
    if (system_prompt !== undefined) updates.systemPrompt = system_prompt
    if (widget_config !== undefined) updates.widgetTheme = widget_config

    const [updatedBot] = await db
      .update(bots)
      .set(updates)
      .where(eq(bots.id, botId))
      .returning()

    res.json(mapBotToDTO(updatedBot))
  }
)

/**
 * DELETE /api/bots/:botId
 * Delete a bot (cascades to documents, chunks, conversations, messages)
 */
botsRouter.delete(
  "/:botId",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { botId } = req.params as { botId: string }

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    // 1. Query and clean up all bot document files in S3
    const botDocs = await db
      .select({ storageKey: documents.storageKey })
      .from(documents)
      .where(eq(documents.botId, botId))

    for (const doc of botDocs) {
      if (doc.storageKey) {
        try {
          await deleteFile(doc.storageKey)
        } catch (err) {
          logger.warn(err, `Failed to delete S3 file ${doc.storageKey} on bot cleanup`)
        }
      }
    }

    // 2. Cascade delete bot in database
    await db.delete(bots).where(eq(bots.id, botId))
    res.status(204).send()
  }
)

/**
 * GET /api/bots/:botId/embed-snippet
 * Return the <script> tag to copy-paste into an external website
 */
botsRouter.get(
  "/:botId/embed-snippet",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const { botId } = req.params as { botId: string }

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const host =
      process.env.PUBLIC_API_URL ||
      `${req.protocol}://${req.get("host") || "localhost:3001"}`
    const scriptUrl = `${host}/widget.js`
    const snippet = `<script\n  src="${scriptUrl}"\n  data-bot-id="${bot.id}"\n  async\n></script>`

    const response: EmbedSnippetResponse = {
      botId: bot.id,
      snippet,
      scriptUrl,
    }

    res.json(response)
  }
)
