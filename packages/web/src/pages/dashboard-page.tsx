import { Show, SignInButton, SignUpButton, useUser } from "@clerk/react"
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useProtectedUserQuery } from "@/hooks/use-api"
import {
  ShieldCheck,
  Lock,
  Mail,
  Fingerprint,
  RefreshCw,
  Send,
  Calendar,
  KeyRound,
  Code2,
} from "lucide-react"

export function DashboardPage() {
  const { user } = useUser()
  const protectedQuery = useProtectedUserQuery()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Signed-Out State */}
      <Show when="signed-out">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Lock className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              The Dashboard and protected API routes require an active Clerk
              session. Sign in or create a new account to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center gap-3">
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </CardFooter>
        </Card>
      </Show>

      {/* Signed-In State */}
      <Show when="signed-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage
                  src={user?.imageUrl}
                  alt={user?.fullName || "User"}
                />
                <AvatarFallback>
                  {user?.firstName?.[0] ||
                    user?.emailAddresses?.[0]?.emailAddress?.[0] ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {user?.fullName || user?.firstName || "Welcome back"}
                  </h1>
                  <Badge
                    variant="default"
                    className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600"
                  >
                    <ShieldCheck className="size-3" />
                    Authenticated
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="api">
            <TabsList className="mb-4">
              <TabsTrigger value="api" className="gap-1.5 text-xs">
                <Send className="size-3.5" />
                <span>TanStack Query API</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-1.5 text-xs">
                <KeyRound className="size-3.5" />
                <span>Profile Credentials</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: TanStack Query + Express Auth */}
            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">
                          Protected Express API Query
                        </CardTitle>
                        <Badge
                          variant={
                            protectedQuery.isSuccess
                              ? "default"
                              : protectedQuery.isError
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {protectedQuery.isFetching
                            ? "Fetching..."
                            : protectedQuery.isSuccess
                              ? "Cached & Valid"
                              : "Ready"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        Calls{" "}
                        <code className="font-mono">GET /api/protected</code>{" "}
                        using Clerk Bearer token via TanStack Query hook{" "}
                        <code className="font-mono">
                          useProtectedUserQuery()
                        </code>
                        .
                      </CardDescription>
                    </div>

                    <Button
                      onClick={() => protectedQuery.refetch()}
                      disabled={protectedQuery.isFetching}
                      size="sm"
                      className="gap-1.5"
                    >
                      <RefreshCw
                        className={`size-3.5 ${protectedQuery.isFetching ? "animate-spin" : ""}`}
                      />
                      <span>Query API</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {protectedQuery.data && (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-4" />
                          Express Backend Verified Clerk JWT Successfully
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Query Status: {protectedQuery.status}
                        </span>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-100 dark:bg-zinc-950">
                        {JSON.stringify(protectedQuery.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!protectedQuery.data &&
                    !protectedQuery.isError &&
                    !protectedQuery.isFetching && (
                      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                        Click "Query API" to fetch and verify your Clerk JWT
                        session with Express backend.
                      </div>
                    )}

                  {protectedQuery.isError && (
                    <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                      {protectedQuery.error?.message}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Code2 className="size-3" />
                    Query Key: ["api", "protected-user"]
                  </span>
                  <span className="font-mono text-[11px]">
                    {protectedQuery.dataUpdatedAt
                      ? `Last fetched: ${new Date(protectedQuery.dataUpdatedAt).toLocaleTimeString()}`
                      : "Stale / Initial"}
                  </span>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab 2: User Profile Details */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Clerk Session Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current user metadata extracted from Clerk authentication
                    context.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-muted/20 rounded-lg border p-3.5">
                      <div className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-xs">
                        <Fingerprint className="text-primary size-3.5" />
                        <span>CLERK USER ID</span>
                      </div>
                      <div className="truncate font-mono text-xs font-semibold">
                        {user?.id}
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-lg border p-3.5">
                      <div className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-xs">
                        <Mail className="text-primary size-3.5" />
                        <span>PRIMARY EMAIL</span>
                      </div>
                      <div className="truncate text-xs font-semibold">
                        {user?.primaryEmailAddress?.emailAddress || "N/A"}
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-lg border p-3.5">
                      <div className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-xs">
                        <Calendar className="text-primary size-3.5" />
                        <span>CREATED AT</span>
                      </div>
                      <div className="text-xs font-semibold">
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>

                    <div className="bg-muted/20 rounded-lg border p-3.5">
                      <div className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-xs">
                        <KeyRound className="text-primary size-3.5" />
                        <span>VERIFICATION STATUS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px]">
                          {user?.primaryEmailAddress?.verification?.status ||
                            "Verified"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-5" />

                  <div className="text-muted-foreground space-y-1 font-mono text-[11px]">
                    <div>Environment: {import.meta.env.MODE}</div>
                    <div>Vite Dev Server: port 5173</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Show>
    </div>
  )
}
