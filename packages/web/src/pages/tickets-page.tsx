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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-400">
          <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
          OPEN
        </span>
      )
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600 dark:text-blue-400">
          <span className="size-1.5 rounded-full bg-blue-500" />
          IN PROGRESS
        </span>
      )
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-2.5" />
          RESOLVED
        </span>
      )
    case "closed":
      return (
        <span className="bg-muted text-muted-foreground border-border inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide">
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
        <span className="py-0.2 inline-flex items-center gap-1 rounded border border-rose-500/25 bg-rose-500/15 px-1.5 text-[10px] font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
          <Flame className="size-2.5 text-rose-500" />
          Urgent
        </span>
      )
    case "high":
      return (
        <span className="py-0.2 inline-flex items-center gap-1 rounded border border-orange-500/25 bg-orange-500/15 px-1.5 text-[10px] font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
          High
        </span>
      )
    case "medium":
      return (
        <span className="py-0.2 inline-flex items-center gap-1 rounded border border-yellow-500/25 bg-yellow-500/15 px-1.5 text-[10px] font-medium tracking-wider text-yellow-600 uppercase dark:text-yellow-400">
          Medium
        </span>
      )
    case "low":
    default:
      return (
        <span className="py-0.2 bg-muted text-muted-foreground border-border/60 inline-flex items-center gap-1 rounded border px-1.5 text-[10px] font-medium tracking-wider uppercase">
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
      className="min-w-0 text-xs leading-relaxed wrap-anywhere"
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
  const allTickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data])
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
  const inProgressCount = allTickets.filter(
    (t) => t.status === "in_progress"
  ).length
  const resolvedCount = allTickets.filter((t) => t.status === "resolved").length

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!replyContent.trim() || !activeId || sendAgentMessageMutation.isPending)
      return

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

  const handleUpdateStatus = async (
    newStatus: "open" | "in_progress" | "resolved" | "closed"
  ) => {
    if (!activeId) return
    try {
      await updateTicketMutation.mutateAsync({
        ticketId: activeId,
        updates: { status: newStatus },
      })
      toast.success(`Ticket marked as ${newStatus.replace("_", " ")}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update ticket status"
      )
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
    <div className="bg-background flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="border-border/80 bg-card/60 flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Support Tickets & Human Handoff
            </h1>
            <div className="border-border/70 bg-muted/40 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
              <span
                className={`size-2 rounded-full ${
                  isWsConnected
                    ? "animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-muted-foreground font-mono text-[10px]">
                {isWsConnected ? "Live Real-Time" : "Connecting..."}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage escalated conversations, live human takeovers, and
            AI-detected visitor frustration.
          </p>
        </div>

        {/* KPI Counter Chips */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-accent text-accent-foreground border-foreground/30 shadow-2xs"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            All{" "}
            <span className="ml-1 font-mono text-[11px] font-bold">
              {allTickets.length}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === "open"
                ? "border-amber-500/50 bg-amber-500/15 font-semibold text-amber-600 shadow-2xs dark:text-amber-400"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            Open{" "}
            <span className="ml-1 font-mono text-[11px] font-bold">
              {openCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === "in_progress"
                ? "border-blue-500/50 bg-blue-500/15 font-semibold text-blue-600 shadow-2xs dark:text-blue-400"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            In Progress{" "}
            <span className="ml-1 font-mono text-[11px] font-bold">
              {inProgressCount}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === "resolved"
                ? "border-emerald-500/50 bg-emerald-500/15 font-semibold text-emerald-600 shadow-2xs dark:text-emerald-400"
                : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50"
            }`}
          >
            Resolved{" "}
            <span className="ml-1 font-mono text-[11px] font-bold">
              {resolvedCount}
            </span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ticketsQuery.refetch()}
            disabled={ticketsQuery.isFetching}
            className="ml-1 h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${ticketsQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main Workspace Body (Split View) ──────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ── Left Pane: Tickets List ─────────────────────────────────── */}
        <div className="border-border/80 bg-muted/10 flex w-88 shrink-0 flex-col border-r">
          {/* Search Box */}
          <div className="border-border/80 bg-card/40 border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
              <Input
                placeholder="Search visitor, email, or bot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {/* Tickets Scroll List */}
          <ScrollArea className="flex-1">
            {ticketsQuery.isLoading ? (
              <div className="space-y-2.5 p-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="space-y-1.5 p-2">
                {filteredTickets.map((ticket) => {
                  const isSelected = activeId === ticket.id
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "bg-card border-foreground/30 ring-foreground/20 shadow-xs ring-1"
                          : "bg-card/50 border-border/60 hover:bg-card hover:border-border"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <span className="text-muted-foreground/70 shrink-0 font-mono text-[10px]">
                          {new Date(ticket.updated_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground truncate text-xs font-semibold">
                          {ticket.visitor_name ||
                            ticket.visitor_email ||
                            "Anonymous Visitor"}
                        </span>
                        {ticket.bot_name && (
                          <span className="text-muted-foreground bg-muted py-0.2 shrink-0 rounded px-1.5 font-mono text-[10px]">
                            {ticket.bot_name}
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground/85 mt-1 line-clamp-2 text-[11px] leading-normal">
                        {ticket.ai_summary ||
                          ticket.last_message ||
                          "Awaiting message exchange..."}
                      </p>

                      <div className="text-muted-foreground/65 border-border/40 mt-2 flex items-center justify-between border-t pt-1 font-mono text-[10px]">
                        <span className="max-w-35 truncate">
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
                <TicketIcon className="text-muted-foreground/40 mb-2 size-8" />
                <p className="text-foreground text-xs font-medium">
                  No tickets found
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {statusFilter !== "all"
                    ? `No tickets currently with status "${statusFilter}".`
                    : "No conversations have been escalated yet."}
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Right Pane: Active Ticket Support Console ────────────────── */}
        <div className="bg-background flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Console Header */}
              <div className="border-border/80 bg-card/50 flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Headphones className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-foreground text-sm font-bold">
                        {activeTicket.visitor_name || "Visitor Session"}
                      </span>
                      {activeTicket.visitor_email && (
                        <span className="text-muted-foreground font-mono text-xs">
                          ({activeTicket.visitor_email})
                        </span>
                      )}
                      {getStatusBadge(activeTicket.status)}
                      {getPriorityBadge(activeTicket.priority)}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
                      <span>
                        Bot:{" "}
                        <strong className="text-foreground">
                          {activeTicket.bot_name}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Ticket:{" "}
                        <strong className="font-mono">
                          {activeTicket.id.slice(0, 8)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reason:{" "}
                        <strong className="text-foreground">
                          {getReasonLabel(activeTicket.escalation_reason)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  {activeTicket.status === "open" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={updateTicketMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 gap-1.5 text-xs font-medium shadow-2xs"
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
                      className="h-8 gap-1.5 border-emerald-500/40 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
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
                <div className="border-primary/25 bg-primary/5 mx-4 mt-3 flex items-start gap-2.5 rounded-xl border p-3 shadow-2xs">
                  <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground text-xs font-semibold">
                        AI Orchestration Summary & Sentiment
                      </span>
                      {activeTicket.sentiment && (
                        <span className="py-0.2 bg-background/80 border-border text-muted-foreground rounded border px-1.5 font-mono text-[10px] uppercase">
                          Sentiment: {activeTicket.sentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground/90 mt-1 text-xs leading-relaxed">
                      {activeTicket.ai_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Live Transcript Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="mx-auto max-w-3xl space-y-4 py-2">
                  {activeTicketQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-14 w-3/4 rounded-xl" />
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isUser = msg.role === "user"
                      const isAgent =
                        msg.role === "agent" || msg.is_human === true

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <div
                              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ${
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
                                isUser
                                  ? "text-muted-foreground justify-end"
                                  : "text-foreground/80 justify-start"
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
                                {new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`rounded-xl px-4 py-3 text-xs shadow-2xs ${
                                isUser
                                  ? "bg-accent text-accent-foreground border-border/80 rounded-tr-xs border"
                                  : isAgent
                                    ? "bg-primary/10 text-foreground border-primary/30 rounded-tl-xs border"
                                    : "bg-card text-foreground border-border/80 rounded-tl-xs border"
                              }`}
                            >
                              <MarkdownContent content={msg.content} />
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => copyText(msg.id, msg.content)}
                                className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-[10px]"
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
                            <div className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
                              <User className="size-3.5" />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-muted-foreground py-12 text-center text-xs">
                      No messages yet recorded for this ticket session.
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </ScrollArea>

              {/* Live Agent Composer Bar */}
              <div className="border-border/80 bg-card/80 space-y-2 border-t p-3.5">
                {/* Canned responses bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-muted-foreground/70 shrink-0 font-mono text-[10px]">
                    Quick:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply(
                        "Hello! I'm jumping in directly to help you resolve this right away."
                      )
                    }
                    className="bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60 cursor-pointer rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap transition-colors"
                  >
                    👋 "Hi, jumping in to help!"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply(
                        "Could you share a bit more detail or a screenshot of what you're seeing?"
                      )
                    }
                    className="bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60 cursor-pointer rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap transition-colors"
                  >
                    🔍 "Could you share more detail?"
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertQuickReply(
                        "I have resolved that for you! Let me know if everything looks good on your end."
                      )
                    }
                    className="bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60 cursor-pointer rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap transition-colors"
                  >
                    ✅ "Resolved! Let me know."
                  </button>
                </div>

                {/* Form Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2"
                >
                  <div className="relative flex-1">
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
                      className="border-border bg-background placeholder:text-muted-foreground focus:ring-primary w-full resize-none rounded-xl border px-3.5 py-2 text-xs focus:ring-1 focus:outline-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      !replyContent.trim() || sendAgentMessageMutation.isPending
                    }
                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 shrink-0 cursor-pointer gap-1.5 px-4 text-xs font-semibold shadow-2xs"
                  >
                    <Send className="size-3.5" />
                    Send Reply
                  </Button>
                </form>

                <div className="text-muted-foreground/70 flex items-center justify-between px-1 font-mono text-[10px]">
                  <span>Delivered via live Visitor SSE Stream</span>
                  <span>AI bot is paused while agent is active</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <TicketIcon className="text-muted-foreground/30 mx-auto mb-3 size-10" />
                <h3 className="text-foreground text-sm font-semibold">
                  Select a Support Ticket
                </h3>
                <p className="text-muted-foreground mt-1 max-w-sm text-xs">
                  Choose a ticket from the left panel to review AI triage
                  details, browse transcript, and chat live with visitors.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
