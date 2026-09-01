import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBotsQuery } from "@/hooks/use-api"
import { useAuth } from "@clerk/react"
import {
  Plus,
  MessageSquareText,
  FileText,
  Bot,
  ArrowRight,
} from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-status-ready/10 text-status-ready",
  processing: "bg-status-processing/10 text-status-processing",
  pending: "bg-status-pending/10 text-status-pending",
  failed: "bg-status-failed/10 text-status-failed",
}

function BotCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  )
}

export function BotListPage() {
  const { orgId } = useAuth()
  const botsQuery = useBotsQuery(orgId)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="bg-primary/10 mb-4 flex size-12 items-center justify-center rounded-xl">
            <Bot className="text-primary size-6" />
          </div>
          <h2 className="text-lg font-semibold">Sign in to view your bots</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            You need an account to create and manage chatbots.
          </p>
          <SignInButton mode="modal">
            <Button className="mt-4 gap-1.5">
              Sign In
              <ArrowRight className="size-3.5" />
            </Button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Bots</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Manage your AI support chatbots.
              </p>
            </div>
            <Link to="/dashboard/bots/new">
              <Button className="gap-1.5">
                <Plus className="size-3.5" />
                Create Bot
              </Button>
            </Link>
          </div>

          {/* Bot Grid */}
          {botsQuery.isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BotCardSkeleton />
              <BotCardSkeleton />
              <BotCardSkeleton />
            </div>
          )}

          {botsQuery.data && botsQuery.data.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
              <div className="bg-primary/10 mb-3 flex size-11 items-center justify-center rounded-xl">
                <MessageSquareText className="text-primary size-5" />
              </div>
              <h3 className="text-sm font-semibold">No bots yet</h3>
              <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                Create your first bot to start turning your documentation into
                an AI support assistant.
              </p>
              <Link to="/dashboard/bots/new" className="mt-4">
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Create Bot
                </Button>
              </Link>
            </div>
          )}

          {botsQuery.data && botsQuery.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {botsQuery.data.map((bot, i) => (
                <Link
                  key={bot.id}
                  to={`/dashboard/bots/${bot.id}`}
                  className="group"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <Card className="transition-[box-shadow,opacity] duration-150 group-active:scale-[0.98] hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                            <Bot className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">
                              {bot.name}
                            </CardTitle>
                            <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                              {bot.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-medium ${STATUS_STYLES.ready}`}
                        >
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <FileText className="size-3" />
                          {bot.system_prompt ? "Has prompt" : "No prompt"}
                        </span>
                        <span className="text-border">|</span>
                        <span className="font-mono text-[11px]">
                          {new Date(bot.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {botsQuery.isError && (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <p className="text-destructive text-sm">
                Failed to load bots. Please try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => botsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </Show>
    </div>
  )
}
