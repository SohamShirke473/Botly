import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { HealthCheckResponse } from "types"

export function App() {
  const [apiResponse, setApiResponse] = useState<HealthCheckResponse | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkApiHealth = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || ""
      const res = await fetch(`${baseUrl}/api/health`)
      const data: HealthCheckResponse = await res.json()
      setApiResponse(data)
    } catch (err) {
      setError(`Error connecting to API: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center p-6">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border p-8 shadow-sm">
        <div>
          <div className="bg-primary/10 text-primary mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold">
            Bun Monorepo
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Botly Monorepo Ready
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            React (Vite + shadcn UI) & Express API (Bun + TypeScript)
          </p>
        </div>

        <div className="bg-muted/40 space-y-1 rounded-lg border p-4 font-mono text-xs">
          <div>
            <span className="text-foreground font-semibold">packages/web:</span>{" "}
            React 19 + Tailwind v4 + shadcn
          </div>
          <div>
            <span className="text-foreground font-semibold">packages/api:</span>{" "}
            Express + TypeScript + Morgan + Helmet
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={checkApiHealth} disabled={isLoading}>
            {isLoading ? "Checking API..." : "Ping Express API (port 3001)"}
          </Button>

          {apiResponse && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive mt-2 rounded-lg p-3 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd className="rounded border px-1 py-0.5">d</kbd> to toggle
          dark mode)
        </div>
      </div>
    </div>
  )
}

export default App
