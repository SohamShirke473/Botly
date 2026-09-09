import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@clerk/react"
import { useBotsQuery } from "@/hooks/use-api"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Bot,
  Plus,
  Settings,
  Users,
  CreditCard,
} from "lucide-react"

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandDialog({
  open,
  onOpenChange,
}: CommandDialogProps) {
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
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  const actions = useMemo(() => [
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
  ], [navigate])

  const filteredBots = useMemo(() => {
    if (!botsQuery.data) return []
    const q = query.trim().toLowerCase()
    if (!q) return botsQuery.data
    return botsQuery.data.filter((b) =>
      b.name.toLowerCase().includes(q) ||
      (b.system_prompt && b.system_prompt.toLowerCase().includes(q))
    )
  }, [botsQuery.data, query])

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q)
    )
  }, [actions, query])

  const allItems = useMemo(() => [
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
  ], [filteredBots, filteredActions, navigate])

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
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSelect(selectedIndex)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl max-w-xl p-0 overflow-hidden border-border/80 shadow-xl bg-card rounded-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-border/70 px-4 py-3.5 bg-card/80">
          <Search className="size-4 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search bots or jump to workspace section..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground outline-none text-foreground font-sans"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center ml-2 cursor-pointer"
            title="Press ESC to close"
          >
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 border border-border/60">
              ESC
            </Badge>
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          {/* Bots Section */}
          {filteredBots.length > 0 && (
            <div className="pb-2">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assistant Bots
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredBots.map((bot, idx) => {
                  const isSelected = selectedIndex === idx
                  return (
                    <button
                      key={bot.id}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Bot className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground font-semibold truncate">{bot.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-sm">
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
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation & Actions
              </div>
              <div className="space-y-0.5 mt-1">
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
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-md bg-muted flex items-center justify-center shrink-0 text-foreground">
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground font-medium">{act.title}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-sm">
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
            <div className="py-8 text-center text-xs text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-border/70 bg-muted/20 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>Navigate with ↑ ↓ and Enter</span>
          <span>Botly Spotlight</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
