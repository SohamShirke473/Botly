import path from "node:path"
import fs from "node:fs"

// Load root .env BEFORE any module imports
const envPath = path.resolve(import.meta.dir, "../../../.env")
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

process.env.TEST_AUTH_ENABLED = "true"
process.env.INTERNAL_API_SECRET = "dev-botly-internal-secret-key-32chars"
process.env.NODE_ENV = "test"

import app from "api"
import type { Server } from "node:http"

export const TEST_ORG_ID = "org_package_test"
export const TEST_USER_ID = "user_package_test"

export const authHeaders = {
  "x-test-org-id": TEST_ORG_ID,
  "x-test-user-id": TEST_USER_ID,
  "Content-Type": "application/json",
}

let server: Server | null = null
let baseUrl = ""

export async function startTestServer(): Promise<string> {
  if (server && baseUrl) return baseUrl

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const address = server!.address()
      if (typeof address === "object" && address !== null) {
        baseUrl = `http://localhost:${address.port}`
        resolve(baseUrl)
      }
    })
  })
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    return new Promise((resolve, reject) => {
      server!.close((err) => {
        if (err) reject(err)
        else {
          server = null
          baseUrl = ""
          resolve()
        }
      })
    })
  }
}

export function getBaseUrl(): string {
  return baseUrl
}
