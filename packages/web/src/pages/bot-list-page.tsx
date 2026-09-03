import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { useBotsQuery } from "@/hooks/use-api"
import { useAuth } from "@clerk/react"
import {
  Plus,
  FileText,
  Bot,
  ArrowRight,
  Search,
  Layers,
} from "lucide-react"
import { motion } from "motion/react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // physics-no-excessive-stagger (< 50ms)
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" as const }, // timing-under-300ms, easing-entrance-ease-out
  },
}

function BotCardSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-md" />
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
  const [search, setSearch] = useState("")

  const filteredBots = useMemo(() => {
    if (!botsQuery.data) return []
    const q = search.trim().toLowerCase()
    if (!q) return botsQuery.data
    return botsQuery.data.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.system_prompt && b.system_prompt.toLowerCase().includes(q))
    )
  }, [botsQuery.data, search])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <div className="bg-primary/5 text-primary mb-4 flex size-12 items-center justify-center rounded-xl ring-1 ring-primary/10">
            <Bot className="size-6" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Sign in to view your bots
          </h2>
          <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
            Connect your documentation and create custom AI customer support
            assistants for your applications.
          </p>
          <SignInButton mode="modal">
            <Button className="mt-5 gap-1.5" size="sm">
              <span>Sign In with Clerk</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </SignInButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Bots
                </h1>
                {botsQuery.data && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    {botsQuery.data.length}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Manage your deployed AI chatbots and documentation sources.
              </p>
            </div>
            <Link to="/dashboard/bots/new">
              <Button size="sm" className="gap-1.5 shadow-xs">
                <Plus className="size-3.5" />
                <span>Create Bot</span>
              </Button>
            </Link>
          </div>

          {/* Search & Filter Controls */}
          {botsQuery.data && botsQuery.data.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" />
                <Input
                  placeholder="Search bots by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-card"
                />
              </div>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear filter
                </Button>
              )}
            </div>
          )}

          {/* Loading Skeletons */}
          {botsQuery.isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BotCardSkeleton />
              <BotCardSkeleton />
              <BotCardSkeleton />
            </div>
          )}

          {/* Empty State: No bots created yet */}
          {botsQuery.data && botsQuery.data.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 p-12 text-center">
              <div className="bg-primary/5 text-primary mb-3 flex size-12 items-center justify-center rounded-xl ring-1 ring-primary/10">
                <Layers className="size-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No bots created yet
              </h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
                Create your first AI bot to connect documents, train on your
                product knowledge, and embed a support widget on your site.
              </p>
              <Link to="/dashboard/bots/new" className="mt-5">
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-3.5" />
                  Create First Bot
                </Button>
              </Link>
            </div>
          )}

          {/* Empty State: Search filter no results */}
          {botsQuery.data &&
            botsQuery.data.length > 0 &&
            filteredBots.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <Search className="text-muted-foreground/40 mb-2 size-6" />
                <p className="text-sm font-medium">No bots match "{search}"</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Try searching for a different keyword or clear the search
                  filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSearch("")}
                >
                  Clear Search
                </Button>
              </div>
            )}

          {/* Bot Cards Grid */}
          {filteredBots.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredBots.map((bot) => (
                <motion.div
                  key={bot.id}
                  variants={cardVariants}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Link
                    to={`/dashboard/bots/${bot.id}`}
                    className="group block h-full"
                  >
                    <Card className="h-full border-border/80 transition-colors duration-150 hover:border-foreground/30 hover:shadow-xs flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-primary/5 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-primary/10 transition-colors group-hover:bg-primary/10">
                              <Bot className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-semibold truncate group-hover:text-foreground transition-colors">
                                {bot.name}
                              </CardTitle>
                              <p className="text-muted-foreground/80 font-mono text-[11px] truncate mt-0.5">
                                {bot.id}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-medium bg-status-ready/10 text-status-ready shrink-0 gap-1.5"
                          >
                            <span className="size-1.5 rounded-full bg-status-ready animate-pulse" />
                            Active
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="border-t border-border/60 pt-3 flex items-center justify-between text-muted-foreground text-xs">
                          <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px]">
                            <FileText className="size-3 text-muted-foreground/70" />
                            {bot.system_prompt
                              ? "Custom prompt"
                              : "Default prompt"}
                          </span>
                          <span className="text-border">•</span>
                          <span className="font-mono text-[11px]">
                            {new Date(bot.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <ArrowRight className="size-3 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
                      </div>
                    </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Error State */}
          {botsQuery.isError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 py-10 text-center">
              <p className="text-destructive text-sm font-medium">
                Failed to load bots.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {botsQuery.error?.message || "Please try again in a moment."}
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
