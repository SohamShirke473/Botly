import { Inngest } from "inngest"

/**
 * Singleton Inngest client for the Botly app.
 * Import this wherever you need to send events or define functions.
 */
export const inngest = new Inngest({ id: "botly" })
