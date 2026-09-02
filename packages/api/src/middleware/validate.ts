import type { Request, Response, NextFunction } from "express"
import { type ZodTypeAny, ZodError } from "zod"

interface ValidationSchemas {
  params?: ZodTypeAny
  body?: ZodTypeAny
  query?: ZodTypeAny
}

/**
 * Express middleware to validate request params, body, and query using Zod.
 * Returns HTTP 400 with structured validation issues if invalid.
 */
export function validate(schemas: ValidationSchemas) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Record<
          string,
          string
        >
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Record<
          string,
          string
        >
      }
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: "Validation Error",
          message: "Request validation failed",
          issues: err.flatten().fieldErrors,
        })
        return
      }
      next(err)
    }
  }
}
