import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { useHealthQuery, useMessageQuery } from "@/hooks/use-api"
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Server,
  RefreshCw,
  Zap,
} from "lucide-react"

export function HomePage() {
  const healthQuery = useHealthQuery()
  const messageQuery = useMessageQuery()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1 text-xs">
          <Layers className="text-primary size-3.5" />
          Bun + Vite + React 19 Monorepo
        </Badge>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Fullstack Monorepo with TanStack Query
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base sm:text-lg">
          Powered by React Router v7, Clerk authentication, Shadcn UI, TanStack
          Query v5, Tailwind v4, and Express API.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button className="gap-2">
              <span>Explore Dashboard</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="outline" className="gap-2">
                <Lock className="size-4" />
                <span>Sign In with Clerk</span>
              </Button>
            </SignInButton>
          </Show>
        </div>
      </div>

      {/* Feature / Architecture Cards using Shadcn Card */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-2 flex size-9 items-center justify-center rounded-lg">
              <Zap className="size-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              TanStack Query v5
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Asynchronous state management with declarative hooks, automatic
              caching, background refetching, and devtools.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Clerk Fullstack Auth
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Turnkey authentication using @clerk/react on the frontend and
              @clerk/express middleware on the Bun backend.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="transition-shadow hover:shadow-sm">
          <CardHeader>
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Server className="size-5" />
            </div>
            <CardTitle className="text-sm font-semibold">
              Express + Shadcn UI
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Express backend with Pino logging & CORS paired with modern Shadcn
              primitives and React Router v7.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Live API Section with TanStack Query */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Health Check Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                <CardTitle className="text-sm">API Health Check</CardTitle>
              </div>
              <Badge
                variant={
                  healthQuery.isSuccess
                    ? "default"
                    : healthQuery.isError
                      ? "destructive"
                      : "secondary"
                }
              >
                {healthQuery.isFetching
                  ? "Fetching..."
                  : healthQuery.isSuccess
                    ? "200 OK"
                    : "Idle"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Managed via <code className="font-mono">useHealthQuery()</code>{" "}
              hook
            </CardDescription>
          </CardHeader>

          <CardContent>
            {healthQuery.data && (
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100 dark:bg-zinc-950">
                {JSON.stringify(healthQuery.data, null, 2)}
              </pre>
            )}

            {healthQuery.isError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                {healthQuery.error?.message}
              </div>
            )}
          </CardContent>

          <CardFooter className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="font-mono text-[11px]">
              {healthQuery.dataUpdatedAt
                ? `Updated: ${new Date(healthQuery.dataUpdatedAt).toLocaleTimeString()}`
                : "Not queried yet"}
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => healthQuery.refetch()}
              disabled={healthQuery.isFetching}
              className="gap-1.5"
            >
              <RefreshCw
                className={`size-3 ${healthQuery.isFetching ? "animate-spin" : ""}`}
              />
              <span>Refetch</span>
            </Button>
          </CardFooter>
        </Card>

        {/* Message Query Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-blue-500" />
                <CardTitle className="text-sm">Greeting Endpoint</CardTitle>
              </div>
              <Badge
                variant={
                  messageQuery.isSuccess
                    ? "default"
                    : messageQuery.isError
                      ? "destructive"
                      : "secondary"
                }
              >
                {messageQuery.isFetching
                  ? "Fetching..."
                  : messageQuery.isSuccess
                    ? "Connected"
                    : "Idle"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Managed via <code className="font-mono">useMessageQuery()</code>{" "}
              hook
            </CardDescription>
          </CardHeader>

          <CardContent>
            {messageQuery.data && (
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100 dark:bg-zinc-950">
                {JSON.stringify(messageQuery.data, null, 2)}
              </pre>
            )}

            {messageQuery.isError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                {messageQuery.error?.message}
              </div>
            )}
          </CardContent>

          <CardFooter className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="font-mono text-[11px]">
              {messageQuery.dataUpdatedAt
                ? `Updated: ${new Date(messageQuery.dataUpdatedAt).toLocaleTimeString()}`
                : "Not queried yet"}
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => messageQuery.refetch()}
              disabled={messageQuery.isFetching}
              className="gap-1.5"
            >
              <RefreshCw
                className={`size-3 ${messageQuery.isFetching ? "animate-spin" : ""}`}
              />
              <span>Refetch</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
