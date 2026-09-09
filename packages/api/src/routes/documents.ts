import { Router, type Request, type Response } from "express"
import multer from "multer"
import { db } from "db"
import { documents, chunks, bots } from "db/schema"
import { eq, and, sql, desc } from "drizzle-orm"
import { requireOrgAuth, verifyBotOrgAccess } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { uploadFile, deleteFile } from "@botly/storage"
import { logger } from "../lib/logger"
import { processDocument, inngest } from "@botly/inngest"
import {
  BotIdParamSchema,
  DocIdParamSchema,
  DocumentBotParamSchema,
  type Document,
  type SourceType,
} from "types"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
})

export const documentsRouter = Router()

// Helper to format DB document to Document DTO without N+1 query
function toDocumentDTO(
  doc: {
    id: string
    botId: string
    filename: string
    sourceType: string
    status: string
    createdAt: Date
  },
  chunkCount = 0
): Document {
  return {
    id: doc.id,
    bot_id: doc.botId,
    filename: doc.filename,
    source_type: doc.sourceType as SourceType,
    status: doc.status as "pending" | "processing" | "ready" | "failed",
    chunk_count: chunkCount,
    created_at: doc.createdAt.toISOString(),
  }
}

// ─── Document Ingestion Trigger Helper ──────────────────────────────

function triggerIngestion(documentId: string) {
  // Use Inngest as the primary asynchronous pipeline; fall back to direct processing if Inngest is offline
  inngest
    .send({
      name: "botly/document.process",
      data: { documentId },
    })
    .catch((err) => {
      logger.warn(
        err,
        `Inngest event send failed for ${documentId}; executing direct processing fallback`
      )
      processDocument(documentId).catch((directErr) => {
        logger.error(directErr, `[Ingestion Error for ${documentId}]`)
      })
    })
}

// ─── Bot-Scoped Document Routes ─────────────────────────────────────

export const botDocumentsRouter = Router({ mergeParams: true })
botDocumentsRouter.use(requireOrgAuth)

/**
 * POST /api/bots/:botId/documents
 * Upload a file (PDF/TXT) or submit a URL
 */
botDocumentsRouter.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    // 1. Check if file upload
    if (req.file) {
      const file = req.file
      const isUrlFile = file.originalname.toLowerCase().endsWith(".url")
      let sourceType: SourceType
      let filename = file.originalname
      let storageKey: string | null = null

      if (isUrlFile) {
        sourceType = "url"
        filename = file.originalname.slice(0, -4)
      } else if (
        file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf")
      ) {
        sourceType = "pdf"
        storageKey = `bots/${botId}/${crypto.randomUUID()}-${file.originalname}`
        await uploadFile(storageKey, file.buffer, file.mimetype)
      } else {
        sourceType = "text"
        storageKey = `bots/${botId}/${crypto.randomUUID()}-${file.originalname}`
        await uploadFile(storageKey, file.buffer, file.mimetype)
      }

      const [newDoc] = await db
        .insert(documents)
        .values({
          botId,
          filename,
          sourceType,
          status: "pending",
          storageKey,
        })
        .returning()

      triggerIngestion(newDoc.id)
      const dto = toDocumentDTO(newDoc, 0)
      res.status(201).json(dto)
      return
    }

    // 2. Check if URL submission
    const url = req.body.url as string | undefined
    if (url && typeof url === "string" && url.startsWith("http")) {
      const [newDoc] = await db
        .insert(documents)
        .values({
          botId,
          filename: url,
          sourceType: "url",
          status: "pending",
          storageKey: null,
        })
        .returning()

      triggerIngestion(newDoc.id)
      const dto = toDocumentDTO(newDoc, 0)
      res.status(201).json(dto)
      return
    }

    res.status(400).json({
      error: "Bad Request",
      message: "Please provide either a valid file upload or a URL",
    })
  }
)

/**
 * GET /api/bots/:botId/documents
 * List all documents + status + chunk count for a bot
 */
botDocumentsRouter.get(
  "/",
  validate({ params: BotIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const docList = await db
      .select({
        id: documents.id,
        botId: documents.botId,
        filename: documents.filename,
        sourceType: documents.sourceType,
        status: documents.status,
        createdAt: documents.createdAt,
        chunkCount: sql<number>`count(${chunks.id})::int`,
      })
      .from(documents)
      .leftJoin(chunks, eq(chunks.documentId, documents.id))
      .where(eq(documents.botId, botId))
      .groupBy(documents.id)
      .orderBy(desc(documents.createdAt))

    const response: Document[] = docList.map((d) => ({
      id: d.id,
      bot_id: d.botId,
      filename: d.filename,
      source_type: d.sourceType as SourceType,
      status: d.status,
      chunk_count: d.chunkCount ?? 0,
      created_at: d.createdAt.toISOString(),
    }))

    res.json(response)
  }
)

/**
 * DELETE /api/bots/:botId/documents/:docId
 * Alternate route support for frontend client compatibility
 */
botDocumentsRouter.delete(
  "/:docId",
  validate({ params: DocumentBotParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const botId = String(req.params.botId)
    const docId = String(req.params.docId)

    const bot = await verifyBotOrgAccess(botId, orgId)
    if (!bot) {
      res.status(404).json({
        error: "Not Found",
        message: "Bot not found or access denied",
      })
      return
    }

    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, docId), eq(documents.botId, botId)))
      .limit(1)

    if (!doc) {
      res.status(404).json({
        error: "Not Found",
        message: "Document not found",
      })
      return
    }

    if (doc.storageKey) {
      try {
        await deleteFile(doc.storageKey)
      } catch (err) {
        logger.warn(err, `Could not delete storage file ${doc.storageKey}`)
      }
    }

    await db.delete(documents).where(eq(documents.id, docId))
    res.status(204).send()
  }
)

// ─── Direct /api/documents/:docId Routes ─────────────────────────────

documentsRouter.use(requireOrgAuth)

/**
 * GET /api/documents/:docId
 * Get one document's detail and status with chunk count in single query
 */
documentsRouter.get(
  "/:docId",
  validate({ params: DocIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const docId = String(req.params.docId)

    const [record] = await db
      .select({
        id: documents.id,
        botId: documents.botId,
        filename: documents.filename,
        sourceType: documents.sourceType,
        status: documents.status,
        createdAt: documents.createdAt,
        botOrgId: bots.orgId,
        chunkCount: sql<number>`count(${chunks.id})::int`,
      })
      .from(documents)
      .innerJoin(bots, eq(bots.id, documents.botId))
      .leftJoin(chunks, eq(chunks.documentId, documents.id))
      .where(eq(documents.id, docId))
      .groupBy(documents.id, bots.orgId)
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Document not found or access denied",
      })
      return
    }

    const dto = toDocumentDTO(record, record.chunkCount)
    res.json(dto)
  }
)

/**
 * DELETE /api/documents/:docId
 * Remove a document and its chunks, and clean up S3
 */
documentsRouter.delete(
  "/:docId",
  validate({ params: DocIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const docId = String(req.params.docId)

    const [record] = await db
      .select({
        doc: documents,
        botOrgId: bots.orgId,
      })
      .from(documents)
      .innerJoin(bots, eq(bots.id, documents.botId))
      .where(eq(documents.id, docId))
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Document not found or access denied",
      })
      return
    }

    if (record.doc.storageKey) {
      try {
        await deleteFile(record.doc.storageKey)
      } catch (err) {
        logger.warn(
          err,
          `Could not delete storage file ${record.doc.storageKey}`
        )
      }
    }

    await db.delete(documents).where(eq(documents.id, docId))
    res.status(204).send()
  }
)

/**
 * POST /api/documents/:docId/reprocess
 * Retry ingestion if it failed or content needs to be re-indexed
 */
documentsRouter.post(
  "/:docId/reprocess",
  validate({ params: DocIdParamSchema }),
  async (req: Request, res: Response) => {
    const { orgId } = req.authContext!
    const docId = String(req.params.docId)

    const [record] = await db
      .select({
        doc: documents,
        botOrgId: bots.orgId,
      })
      .from(documents)
      .innerJoin(bots, eq(bots.id, documents.botId))
      .where(eq(documents.id, docId))
      .limit(1)

    if (!record || record.botOrgId !== orgId) {
      res.status(404).json({
        error: "Not Found",
        message: "Document not found or access denied",
      })
      return
    }

    await db
      .update(documents)
      .set({ status: "pending" })
      .where(eq(documents.id, docId))

    triggerIngestion(docId)

    const updated = {
      ...record.doc,
      status: "pending" as const,
    }
    const dto = toDocumentDTO(updated, 0)
    res.json(dto)
  }
)
