import "dotenv/config"
import { drizzle } from "drizzle-orm/bun-sql"
import { SQL } from "bun"
import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/botly"

export const client = new SQL(connectionString)
export const db = drizzle({ client })

export { schema }
