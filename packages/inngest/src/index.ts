/**
 * @botly/inngest
 *
 * Public API for the Inngest package:
 *   - `inngest`   — the singleton client (use to send events)
 *   - `functions` — all registered Inngest functions (passed to `serve()`)
 */
export { inngest } from "./client"
export { helloWorld } from "./functions/hello-world"
export {
  processDocument,
  processDocumentFunction,
} from "./functions/process-document"

import { helloWorld } from "./functions/hello-world"
import { processDocumentFunction } from "./functions/process-document"

/**
 * Complete list of Inngest functions to register with the serve handler.
 * Add every new function here so it is automatically picked up by the API.
 */
export const functions = [helloWorld, processDocumentFunction]

