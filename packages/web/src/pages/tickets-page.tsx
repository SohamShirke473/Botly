import { useState, useMemo, useRef, useEffect } from "react"
import {
  useTicketsQuery,
  useTicketQuery,
  useUpdateTicketMutation,
  useSendAgentTicketMessageMutation,
} from "@/hooks/use-api"
import { useAdminWs } from "@/hooks/use-admin-ws"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { renderMarkdown } from "@/lib/markdown"
import { toast } from "sonner"
import {
  Ticket as TicketIcon,
  Headphones,
  Bot as BotIcon,
  User,
  Send,
  Sparkles,
  CheckCircle2,
  Search,
  Check,
  Copy,
  RefreshCw,
  Flame,
} from "lucide-react"

/* ── Status and Priority helpers ─────────────────────────────────────── */

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          OPEN
        </span>
      )
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span className="size-1.5 rounded-full bg-blue-500" />
          IN PROGRESS
        </span>
      )
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="size-2.5" />
          RESOLVED
        </span>
      )
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-muted text-muted-foreground border border-border">
          CLOSED
        </span>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          <Flame className="size-2.5 text-rose-500" />
          Urgent
        </span>
      )
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
          High
        </span>
      )
    case "medium":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/25">
          Medium
        </span>
      )
    case "low":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground border border-border/60">
          Low
        </span>
      )
  }
}

function getReasonLabel(reason: string) {
  switch (reason) {
    case "frustrated_user":
      return "Frustration Detected"
    case "user_requested":
      return "Visitor Requested Human"
    case "negative_sentiment":
      return "Negative Sentiment"
    case "manual_transfer":
      return "Manual Transfer"
    case "bot_escalation":
      return "Bot Escalation"
    default:
      return reason.replace("_", " ")
  }
}

/* ── Markdown Content Render ─────────────────────────────────────────── */

function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className="min-w-0 wrap-anywhere leading-relaxed text-xs"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

/* ── Main Tickets Page ───────────────────────────────────────────────── */

export function TicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [replyContent, setReplyContent] = useState<string>("")
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)

  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Real-time WebSocket connection for live agent updates
  const { isConnected: isWsConnected } = useAdminWs({
    conversationId: selectedTicketId ?? undefined,
  })

  // Queries & Mutations
  const ticketsQuery = useTicketsQuery({
    status: statusFilter,
  })

  const activeTicketQuery = useTicketQuery(selectedTicketId ?? undefined)
  const updateTicketMutation = useUpdateTicketMutation()
  const sendAgentMessageMutation = useSendAgentTicketMessageMutation()

  // Select first ticket if none selected
  const allTickets = ticketsQuery.data ?? []
  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return allTickets[0] ?? null
    return allTickets.find((t) => t.id === selectedTicketId) ?? null
  }, [allTickets, selectedTicketId])

  const activeId = activeTicket?.id ?? null

  // Auto scroll transcript to bottom on new messages
  const messages = activeTicketQuery.data?.messages ?? []
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  // Filter tickets by search query
  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        t.visitor_name?.toLowerCase().includes(q) ||
        t.visitor_email?.toLowerCase().includes(q) ||
        t.bot_name?.toLowerCase().includes(q) ||
        t.last_message?.toLowerCase().includes(q) ||
        t.ai_summary?.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      )
    })
  }, [allTickets, searchQuery])

  // KPI counts
  const openCount = allTickets.filter((t) => t.status === "open").length
  const inProgressCount = allTickets.filter((t) => t.status === "in_progress").length
  const resolvedCount = allTickets.filter((t) => t.status === "resolved").length

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!replyContent.trim() || !activeId || sendAgentMessageMutation.isPending) return

    const text = replyContent.trim()
    setReplyContent("")

    try {
      await sendAgentMessageMutation.mutateAsync({
        ticketId: activeId,
        content: text,
      })
      toast.success("Agent reply delivered to visitor")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
      setReplyContent(text) // Restore on failure
    }
  }

  const handleUpdateStatus = async (newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    if (!activeId) return
    try {
      await updateTicketMutation.mutateAsync({
        ticketId: activeId,
        updates: { status: newStatus },
      })
      toast.success(`Ticket marked as ${newStatus.replace("_", " ")}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket status")
    }
  }

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const insertQuickReply = (text: string) => {
    setReplyContent(text)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="border-b border-border/80 bg-card/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Support Tickets & Human Handoff
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-border/70 bg-muted/40">
              <span
                className={`size-2 rounded-full ${
                  isWsConnected
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-muted-foreground font-mono text-[10px]">
                {isWsConnected ? "Live Real-Time" : "Connecting..."}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage escalated conversations, live human takeovers, and AI-detected visitor frustration.
          </p>
        </div>

        {/* KPI Counter Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-accent text-accent-foreground border-foreground/30 shadow-2xs"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            All <span className="ml-1 font-mono text-[11px] font-bold">{allTickets.length}</span>
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              statusFilter === "open"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/50 shadow-2xs font-semibold"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            Open <span className="ml-1 font-mono text-[11px] font-bold">{openCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              statusFilter === "in_progress"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/50 shadow-2xs font-semibold"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            In Progress <span className="ml-1 font-mono text-[11px] font-bold">{inProgressCount}</span>
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              statusFilter === "resolved"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 shadow-2xs font-semibold"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            Resolved <span className="ml-1 font-mono text-[11px] font-bold">{resolvedCount}</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ticketsQuery.refetch()}
            disabled={ticketsQuery.isFetching}
            className="h-8 gap-1.5 text-xs ml-1"
          >
            <RefreshCw className={`size-3.5 ${ticketsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Workspace Body (Split View) ──────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left Pane: Tickets List ─────────────────────────────────── */}
        <div className="w-88 shrink-0 border-r border-border/80 flex flex-col bg-muted/10">
          {/* Search Box */}
          <div className="p-3 border-b border-border/80 bg-card/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search visitor, email, or bot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>
          </div>

          {/* Tickets Scroll List */}
          <ScrollArea className="flex-1">
            {ticketsQuery.isLoading ? (
              <div className="p-3 space-y-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="p-2 space-y-1.5">
                {filteredTickets.map((ticket) => {
                  const isSelected = activeId === ticket.id
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full text-left rounded-xl p-3 transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/20"
                          : "bg-card/50 border-border/60 hover:bg-card hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">
                          {new Date(ticket.updated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {ticket.visitor_name || ticket.visitor_email || "Anonymous Visitor"}
                        </span>
                        {ticket.bot_name && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded font-mono shrink-0">
                            {ticket.bot_name}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground/85 leading-normal">
                        {ticket.ai_summary || ticket.last_message || "Awaiting message exchange..."}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/65 font-mono pt-1 border-t border-border/40">
                        <span className="truncate max-w-[140px]">
                          {getReasonLabel(ticket.escalation_reason)}
                        </span>
                        <span>{ticket.message_count ?? 0} msgs</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <TicketIcon className="size-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-foreground">No tickets found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {statusFilter !== "all"
                    ? `No tickets currently with status "${statusFilter}".`
                    : "No conversations have been escalated yet."}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Right Pane: Active Ticket Support Console ────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Console Header */}
              <div className="border-b border-border/80 bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Headphones className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {activeTicket.visitor_name || "Visitor Session"}
                      </span>
                      {activeTicket.visitor_email && (
                        <span className="text-xs text-muted-foreground font-mono">
                          ({activeTicket.visitor_email})
                        </span>
                      )}
                      {getStatusBadge(activeTicket.status)}
                      {getPriorityBadge(activeTicket.priority)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>Bot: <strong className="text-foreground">{activeTicket.bot_name}</strong></span>
                      <span>•</span>
                      <span>Ticket: <strong className="font-mono">{activeTicket.id.slice(0, 8)}</strong></span>
                      <span>•</span>
                      <span>Reason: <strong className="text-foreground">{getReasonLabel(activeTicket.escalation_reason)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeTicket.status === "open" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={updateTicketMutation.isPending}
                      className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs font-medium"
                    >
                      <Headphones className="size-3.5" />
                      Take Over Session
                    </Button>
                  )}

                  {activeTicket.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("resolved")}
                      disabled={updateTicketMutation.isPending}
                      variant="outline"
                      className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 font-medium"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Resolve Ticket
                    </Button>
                  )}

                  {activeTicket.status === "resolved" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={updateTicketMutation.isPending}
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </div>

              {/* AI Executive Summary Banner */}
              {activeTicket.ai_summary && (
                <div className="mx-4 mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3 flex items-start gap-2.5 shadow-2xs">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        AI Orchestration Summary & Sentiment
                      </span>
                      {activeTicket.sentiment && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background/80 border border-border text-muted-foreground uppercase">
                          Sentiment: {activeTicket.sentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                      {activeTicket.ai_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Transcript Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  {activeTicketQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-3/4 rounded-xl" />
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isUser = msg.role === "user"
                      const isAgent = msg.role === "agent" || msg.is_human === true

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <div
                              className={`size-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5 shadow-2xs ${
                                isAgent
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isAgent ? (
                                <Headphones className="size-3.5" />
                              ) : (
                                <BotIcon className="size-3.5" />
                              )}
                            </div>
                          )}

                          <div className="group relative max-w-[76%] space-y-1">
                            {/* Sender Pill */}
                            <div
                              className={`flex items-center gap-1.5 text-[10px] font-medium ${
                                isUser ? "justify-end text-muted-foreground" : "justify-start text-foreground/80"
                              }`}
                            >
                              <span>
                                {isUser
                                  ? activeTicket.visitor_name || "Visitor"
                                  : isAgent
                                  ? `Agent: ${msg.sender_name || "Support Team"}`
                                  : "AI Bot"}
                              </span>
                              <span className="text-muted-foreground/60 font-mono">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`rounded-xl px-4 py-3 text-xs shadow-2xs ${
                                isUser
                                  ? "bg-accent text-accent-foreground border border-border/80 rounded-tr-xs"
                                  : isAgent
                                  ? "bg-primary/10 text-foreground border border-primary/30 rounded-tl-xs"
                                  : "bg-card text-foreground border border-border/80 rounded-tl-xs"
                              }`}
                            >
                              <MarkdownContent content={msg.content} />
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => copyText(msg.id, msg.content)}
                                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                              >
                                {copiedMsgId === msg.id ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                                Copy
                              </button>
                            </div>
                          </div>

                          {isUser && (
                            <div className="size-7 shrink-0 rounded-lg bg-muted text-muted-foreground flex items-center justify-center mt-0.5">
                              <User className="size-3.5" />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No messages yet recorded for this ticket session.
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>

              {/* Live Agent Composer Bar */}
              <div className="border-t border-border/80 bg-card/80 p-3.5 space-y-2">
                {/* Canned responses bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-muted-foreground/70 font-mono text-[10px] shrink-0">Quick:</span>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply("Hello! I'm jumping in directly to help you resolve this right away.")
                    }
                    className="px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-border/60"
                  >
                    👋 "Hi, jumping in to help!"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply("Could you share a bit more detail or a screenshot of what you're seeing?")
                    }
                    className="px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-border/60"
                  >
                    🔍 "Could you share more detail?"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply("I have resolved that for you! Let me know if everything looks good on your end.")
                    }
                    className="px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] whitespace-nowrap transition-colors cursor-pointer border border-border/60"
                  >
                    ✅ "Resolved! Let me know."
                  </button>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Type reply to visitor... (Press Enter to send, Shift+Enter for newline)"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || sendAgentMessageMutation.isPending}
                    className="h-10 px-4 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Send className="size-3.5" />
                    Send Reply
                  </Button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono px-1">
                  <span>Delivered via live Visitor SSE Stream</span>
                  <span>AI bot is paused while agent is active</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <TicketIcon className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground">Select a Support Ticket</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Choose a ticket from the left panel to review AI triage details, browse transcript, and chat live with visitors.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
