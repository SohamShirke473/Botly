import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@clerk/react"
import { useBotsQuery } from "@/hooks/use-api"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Bot, Plus, Settings, Users, CreditCard } from "lucide-react"

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const navigate = useNavigate()
  const { orgId } = useAuth()
  const botsQuery = useBotsQuery(orgId)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Listen for ⌘K or Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  // Reset query on open
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }

  const actions = useMemo(
    () => [
      {
        id: "all-bots",
        title: "All Bots",
        subtitle: "View and manage all customer support bots",
        icon: Bot,
        category: "Navigation",
        action: () => navigate("/dashboard"),
      },
      {
        id: "create-bot",
        title: "Create New Bot",
        subtitle: "Train an AI bot with custom knowledge base",
        icon: Plus,
        category: "Actions",
        action: () => navigate("/dashboard/bots/new"),
      },
      {
        id: "organization",
        title: "Team & Members",
        subtitle: "Manage organization members, roles, and invites",
        icon: Users,
        category: "Workspace",
        action: () => navigate("/dashboard/organization"),
      },
      {
        id: "billing",
        title: "Billing & Plans",
        subtitle: "View subscription tiers, usage limits, and invoices",
        icon: CreditCard,
        category: "Workspace",
        action: () => navigate("/dashboard/billing"),
      },
      {
        id: "settings",
        title: "Workspace Settings",
        subtitle: "Theme appearance, security context, and preferences",
        icon: Settings,
        category: "Workspace",
        action: () => navigate("/dashboard/settings"),
      },
    ],
    [navigate]
  )

  const filteredBots = useMemo(() => {
    if (!botsQuery.data) return []
    const q = query.trim().toLowerCase()
    if (!q) return botsQuery.data
    return botsQuery.data.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.system_prompt && b.system_prompt.toLowerCase().includes(q))
    )
  }, [botsQuery.data, query])

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    )
  }, [actions, query])

  const allItems = useMemo(
    () => [
      ...filteredBots.map((bot) => ({
        type: "bot" as const,
        id: bot.id,
        title: bot.name,
        subtitle: bot.system_prompt || "Customer support AI bot",
        action: () => navigate(`/dashboard/bots/${bot.id}`),
      })),
      ...filteredActions.map((act) => ({
        type: "action" as const,
        id: act.id,
        title: act.title,
        subtitle: act.subtitle,
        icon: act.icon,
        action: act.action,
      })),
    ],
    [filteredBots, filteredActions, navigate]
  )

  const handleSelect = (idx: number) => {
    if (allItems[idx]) {
      onOpenChange(false)
      allItems[idx].action()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length)
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSelect(selectedIndex)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="border-border/80 bg-card max-w-xl overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-xl"
      >
        {/* Search Input */}
        <div className="border-border/70 bg-card/80 flex items-center border-b px-4 py-3.5">
          <Search className="text-muted-foreground mr-3 size-4 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search bots or jump to workspace section..."
            className="placeholder:text-muted-foreground text-foreground w-full bg-transparent font-sans text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-2 flex cursor-pointer items-center"
            title="Press ESC to close"
          >
            <Badge
              variant="secondary"
              className="border-border/60 border px-1.5 py-0.5 font-mono text-[10px]"
            >
              ESC
            </Badge>
          </button>
        </div>

        {/* Results List */}
        <div className="divide-border/40 max-h-80 divide-y overflow-y-auto p-2">
          {/* Bots Section */}
          {filteredBots.length > 0 && (
            <div className="pb-2">
              <div className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                Assistant Bots
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredBots.map((bot, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                          <Bot className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground truncate font-semibold">
                            {bot.name}
                          </div>
                          <div className="text-muted-foreground max-w-sm truncate text-[11px]">
                            {bot.system_prompt || "AI Assistant"}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="pt-2">
              <div className="text-muted-foreground px-2 py-1 text-[10px] font-semibold tracking-wider uppercase">
                Navigation & Actions
              </div>
              <div className="mt-1 space-y-0.5">
                {filteredActions.map((act, actIdx) => {
                  const globalIdx = filteredBots.length + actIdx
                  const isSelected = selectedIndex === globalIdx
                  const Icon = act.icon
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => handleSelect(globalIdx)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground font-medium">
                            {act.title}
                          </div>
                          <div className="text-muted-foreground max-w-sm truncate text-[11px]">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="text-muted-foreground py-8 text-center text-xs">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-border/70 bg-muted/20 text-muted-foreground flex items-center justify-between border-t px-4 py-2 font-mono text-[11px]">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>Botly Spotlight</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
