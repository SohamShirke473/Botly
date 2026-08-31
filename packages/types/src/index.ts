import { z } from "zod"

// Re-export zod so consumers have a consistent zod instance
export { z }

// 1. Health check schema & types
export const HealthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
})

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>

// 2. Message response schema & types
export const MessageResponseSchema = z.object({
  message: z.string(),
})

export type MessageResponse = z.infer<typeof MessageResponseSchema>

// 3. User schema & types (sample DTO)
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  createdAt: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>
export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true })
export type CreateUserInput = z.infer<typeof CreateUserSchema>

// 4. Standard API error response
export const ApiErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>
