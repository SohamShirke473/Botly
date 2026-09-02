import { Router, type Request, type Response, type NextFunction } from "express"
import { db } from "db"
import { documents } from "db/schema"
import { eq } from "drizzle-orm"
import { validate } from "../middleware/validate"
import {
  DocIdParamSchema,
  DocumentStatusUpdateSchema,
} from "types"

export const internalRouter = Router()

/**
 * Authentication middleware for internal worker routes.
 * Requires a valid x-internal-secret header.
 */
function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedSecret = process.env.INTERNAL_API_SECRET
  if (!expectedSecret) {
    throw new Error("INTERNAL_API_SECRET env var is required")
  }

  const secret = req.headers["x-internal-secret"]
  if (!secret || secret !== expectedSecret) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid internal authorization secret",
    })
    return
  }

  next()
}

// Secure all /internal routes with internal secret auth
internalRouter.use(requireInternalAuth)

/**
 * PATCH /internal/documents/:docId/status
 * Internal endpoint called by worker to update document status:
 * pending | processing | ready | failed
 */
internalRouter.patch(
  "/documents/:docId/status",
  validate({ params: DocIdParamSchema, body: DocumentStatusUpdateSchema }),
  async (req: Request, res: Response) => {
    const docId = String(req.params.docId)
    const { status } = req.body

    const [updatedDoc] = await db
      .update(documents)
      .set({ status })
      .where(eq(documents.id, docId))
      .returning()

    if (!updatedDoc) {
      res.status(404).json({
        error: "Not Found",
        message: `Document ${docId} not found`,
      })
      return
    }

    res.json({
      success: true,
      id: updatedDoc.id,
      status: updatedDoc.status,
    })
  }
)
