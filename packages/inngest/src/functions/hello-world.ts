import { inngest } from "../client"

/**
 * Example "Hello World" Inngest function.
 *
 * Trigger: send an event named "test/hello.world" with a `data.email` field.
 * The function will sleep for 1 second, then return a greeting.
 *
 * To test locally, hit GET /api/hello on the API server, or use the
 * "Invoke" button in the Inngest Dev Server UI at http://localhost:8288.
 */
export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello World",
    triggers: [{ event: "test/hello.world" as const }],
  },
  async ({ event, step }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data as Record<string, any>
    await step.sleep("wait-a-moment", "1s")

    return {
      message: `Hello, ${(data.email as string | undefined) ?? "stranger"}! 👋`,
    }
  }
)
