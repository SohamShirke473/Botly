import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  X,
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
    <div className="border-border/70 bg-card/60 flex h-[128px] flex-col justify-between rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-10.5 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <div className="border-border/50 flex items-center justify-between border-t pt-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
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
        (b.system_prompt && b.system_prompt.toLowerCase().includes(q))
    )
  }, [botsQuery.data, search])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <div className="bg-primary/5 text-primary ring-primary/10 mb-4 flex size-12 items-center justify-center rounded-xl ring-1">
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
                <h1 className="text-foreground text-xl font-bold tracking-tight">
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
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="text-muted-foreground/70 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search bots by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card border-border/80 focus-visible:ring-primary/20 h-9 rounded-xl pr-8 pl-9 text-xs shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/60 absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-0.5 transition-colors"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="text-muted-foreground text-xs font-medium">
                Showing {filteredBots.length} of {botsQuery.data.length}{" "}
                {botsQuery.data.length === 1 ? "bot" : "bots"}
              </div>
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
            <div className="bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
              <div className="bg-primary/5 text-primary ring-primary/10 mb-3 flex size-12 items-center justify-center rounded-xl ring-1">
                <Layers className="size-6" />
              </div>
              <h3 className="text-foreground text-sm font-semibold">
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
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <Link
                    to={`/dashboard/bots/${bot.id}`}
                    className="group block h-full"
                  >
                    <div className="border-border/80 bg-card hover:border-primary/40 flex h-full flex-col justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md">
                      {/* Top: Icon, Bot Name, Prompt snippet, Status */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="bg-primary/10 text-primary ring-primary/15 group-hover:bg-primary group-hover:text-primary-foreground flex size-10.5 shrink-0 items-center justify-center rounded-xl shadow-2xs ring-1 transition-all duration-200 group-hover:scale-105">
                              <Bot className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-foreground group-hover:text-primary truncate text-sm font-semibold tracking-tight transition-colors">
                                {bot.name}
                              </h3>
                              <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-relaxed">
                                {bot.system_prompt ||
                                  "Customer support AI assistant"}
                              </p>
                            </div>
                          </div>
                          <span className="bg-status-ready/15 text-status-ready border-status-ready/20 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                            <span className="bg-status-ready size-1.5 animate-pulse rounded-full" />
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Prompt indicator, Created date, Manage link */}
                      <div className="border-border/60 text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 truncate text-[11px]">
                            <FileText className="text-muted-foreground/70 size-3 shrink-0" />
                            <span className="truncate">
                              {bot.system_prompt
                                ? "Custom prompt"
                                : "Default prompt"}
                            </span>
                          </span>
                          <span className="text-border shrink-0">•</span>
                          <span className="shrink-0 font-mono text-[11px]">
                            {new Date(bot.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-primary inline-flex shrink-0 items-center gap-1 text-[11px] font-medium opacity-85 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
                          <span>Manage</span>
                          <ArrowRight className="size-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Error State */}
          {botsQuery.isError && (
            <div className="border-destructive/20 bg-destructive/5 rounded-xl border py-10 text-center">
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
