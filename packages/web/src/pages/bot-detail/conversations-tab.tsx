import { useState, useRef, useEffect } from "react"
import {
  useConversationsQuery,
  useMessagesQuery,
  useSendConversationMessageMutation,
  useUpdateConversationStatusMutation,
} from "@/hooks/use-api"
import { useAdminWs } from "@/hooks/use-admin-ws"
import type { Bot, Conversation } from "types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquareText,
  Bot as BotIcon,
  User,
  Copy,
  Check,
  Headphones,
  Send,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import { renderMarkdown } from "@/lib/markdown"
import { toast } from "sonner"

/* ── Markdown styles injected once into the document head ────────────── */
const MARKDOWN_STYLES = `
  .md-h1 { font-size:14px;   font-weight:700; margin:6px 0 2px; }
  .md-h2 { font-size:13.5px; font-weight:700; margin:5px 0 2px; }
  .md-h3 { font-size:13px;   font-weight:700; margin:4px 0 2px; }
  .md-h4 { font-size:12.5px; font-weight:600; margin:3px 0 1px; }
  .md-h5 { font-size:12px;   font-weight:600; margin:2px 0 1px; }
  .md-h6 { font-size:11.5px; font-weight:600; opacity:.7; margin:2px 0 1px; }
  .md-hr  { border:none; border-top:1px solid currentColor; opacity:.15; margin:5px 0; }
  .md-p   { line-height:1.55; }
  .md-empty { height:0.35em; }
  .md-ol-item { display:flex; align-items:baseline; gap:4px; line-height:1.55; }
  .md-ol-num  { font-weight:600; min-width:1.5em; flex-shrink:0; }
  .md-li  { line-height:1.55; padding-left:2px; }
  .md-code {
    background: rgba(125,125,125,.12);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 11px;
  }
  .md-link { text-decoration:underline; font-weight:500; }
`

if (typeof document !== "undefined" && !document.getElementById("botly-md-styles")) {
  const styleEl = document.createElement("style")
  styleEl.id = "botly-md-styles"
  styleEl.textContent = MARKDOWN_STYLES
  document.head.appendChild(styleEl)
}

function formatVisitorDisplay(convo: Conversation): string {
  if (convo.visitor_name) return convo.visitor_name
  if (convo.visitor_email) return convo.visitor_email
  if (convo.visitor_id.startsWith("visitor-")) {
    return `Visitor #${convo.visitor_id.replace("visitor-", "").slice(0, 6)}`
  }
  return `Visitor #${convo.visitor_id.slice(0, 6)}`
}

function renderStatusBadge(status?: string) {
  switch (status) {
    case "waiting_agent":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span className="size-1 rounded-full bg-amber-500 animate-ping" />
          Awaiting Agent
        </span>
      )
    case "agent_active":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span className="size-1 rounded-full bg-blue-500" />
          Agent Active
        </span>
      )
    case "resolved":
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          Resolved
        </span>
      )
    case "bot":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium tracking-wider bg-muted text-muted-foreground border border-border/60">
          AI Bot
        </span>
      )
  }
}

/* ── Markdown bubble ─────────────────────────────────────────────────── */
function MarkdownContent({
  content,
  isUser,
}: {
  content: string
  isUser: boolean
}) {
  if (isUser) {
    return <p className="min-w-0 wrap-break-word whitespace-pre-wrap leading-relaxed">{content}</p>
  }

  return (
    <div
      className="min-w-0 wrap-anywhere leading-relaxed text-xs"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

/* ── Main tab ────────────────────────────────────────────────────────── */
export function ConversationsTab({ bot }: { bot: Bot }) {
  const convosQuery = useConversationsQuery(bot.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [agentReply, setAgentReply] = useState<string>("")
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const activeId = selectedId ?? convosQuery.data?.[0]?.id ?? null
  const messagesQuery = useMessagesQuery(activeId ?? undefined)
  const sendMessageMutation = useSendConversationMessageMutation()
  const updateStatusMutation = useUpdateConversationStatusMutation()

  // Real-time WebSocket connection to receive visitor and agent messages live
  const { isConnected: isWsConnected } = useAdminWs({
    conversationId: activeId ?? undefined,
  })

  const activeConvo = convosQuery.data?.find((c) => c.id === activeId)
  const isAgentActive = activeConvo?.status === "agent_active"
  const isWaitingAgent = activeConvo?.status === "waiting_agent"

  // Auto scroll transcript on new messages
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesQuery.data?.length])

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    toast.success("Message copied")
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleSendReply = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!agentReply.trim() || !activeId || sendMessageMutation.isPending) return

    const text = agentReply.trim()
    setAgentReply("")

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: activeId,
        content: text,
      })
      toast.success("Message sent to visitor")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send message")
      setAgentReply(text)
    }
  }

  const handleStatusToggle = async (status: string) => {
    if (!activeId || updateStatusMutation.isPending) return
    try {
      await updateStatusMutation.mutateAsync({
        conversationId: activeId,
        status,
      })
      toast.success(
        status === "agent_active"
          ? "You took over this conversation"
          : status === "bot"
          ? "Conversation handed back to AI"
          : "Conversation marked as resolved"
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  return (
    <div className="flex h-[660px] max-h-[calc(100vh-200px)] rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Conversation Sessions List */}
      <div className="w-80 shrink-0 border-r border-border/80 flex flex-col bg-muted/10">
        <div className="border-b border-border/80 px-3.5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Sessions
            </h4>
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${
                  isWsConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>{isWsConnected ? "Live" : "WS"}</span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            {convosQuery.data?.length ?? 0} total
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {convosQuery.isLoading ? (
            <div className="space-y-1.5 p-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : convosQuery.data && convosQuery.data.length > 0 ? (
            <div className="p-1.5 space-y-1">
              {convosQuery.data.map((convo) => {
                const isSelected = activeId === convo.id
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedId(convo.id)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent text-accent-foreground font-medium shadow-2xs border-l-2 border-foreground"
                        : "hover:bg-muted/50 text-muted-foreground border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {formatVisitorDisplay(convo)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">
                        {new Date(convo.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-1">
                      <p className="truncate text-[11px] text-muted-foreground/80 leading-normal flex-1">
                        {convo.last_message || "No messages"}
                      </p>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 font-mono">
                      {renderStatusBadge(convo.status)}
                      <span>{convo.message_count ?? 0} turns</span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <div>
                <MessageSquareText className="text-muted-foreground/40 mx-auto mb-1.5 size-5" />
                <p className="text-xs font-medium text-foreground">
                  No conversations yet
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[180px]">
                  Visitor chats will appear here once the widget is active.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Transcript & Live Agent Console */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {activeId ? (
          <>
            {/* Header with status toggle & actions */}
            <div className="border-b border-border/80 px-4 py-3 flex items-center justify-between bg-card/60 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-foreground truncate">
                  {activeConvo ? formatVisitorDisplay(activeConvo) : "Transcript"}
                </span>
                <span className="text-border">•</span>
                <span className="font-mono text-[11px] text-muted-foreground truncate hidden sm:inline">
                  {activeConvo?.visitor_id}
                </span>
                {renderStatusBadge(activeConvo?.status)}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAgentActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusToggle("bot")}
                    disabled={updateStatusMutation.isPending}
                    className="h-7 text-xs gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    Return to AI
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleStatusToggle("agent_active")}
                    disabled={updateStatusMutation.isPending}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-2xs font-medium"
                  >
                    <Headphones className="size-3" />
                    Take Over
                  </Button>
                )}

                {activeConvo?.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusToggle("resolved")}
                    disabled={updateStatusMutation.isPending}
                    className="h-7 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                  >
                    <CheckCircle2 className="size-3" />
                    Resolve
                  </Button>
                )}

                <Badge variant="secondary" className="text-[10px] font-mono">
                  {messagesQuery.data?.length ?? 0} msgs
                </Badge>
              </div>
            </div>

            {/* AI Paused Notice Banner */}
            {(isAgentActive || isWaitingAgent) && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {isWaitingAgent
                    ? "Visitor requested human support. AI is standing by."
                    : "Human takeover active. AI bot is paused for this session."}
                </span>
                {isWaitingAgent && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusToggle("agent_active")}
                    className="h-6 text-[11px] px-2.5 bg-amber-600 text-white hover:bg-amber-700"
                  >
                    Accept & Chat
                  </Button>
                )}
              </div>
            )}

            {/* Transcript Messages Area */}
            <ScrollArea className="min-h-0 flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto py-2">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />
                    ))}
                  </div>
                ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                  messagesQuery.data.map((msg) => {
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
                            className={`size-7 shrink-0 items-center justify-center rounded-lg mt-0.5 flex shadow-2xs ${
                              isAgent
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-primary"
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
                          {/* Label */}
                          <div
                            className={`text-[10px] font-medium flex items-center gap-1.5 ${
                              isUser
                                ? "justify-end text-muted-foreground"
                                : "justify-start text-foreground/75"
                            }`}
                          >
                            <span>
                              {isUser
                                ? "Visitor"
                                : isAgent
                                ? `Agent: ${msg.sender_name || "Support"}`
                                : "AI Bot"}
                            </span>
                          </div>

                          <div
                            className={`rounded-xl px-3.5 py-2.5 text-xs shadow-2xs ${
                              isUser
                                ? "bg-primary text-primary-foreground rounded-tr-xs"
                                : isAgent
                                ? "bg-primary/10 text-foreground border border-primary/30 rounded-tl-xs"
                                : "bg-card text-foreground border border-border/80 rounded-tl-xs"
                            }`}
                          >
                            <MarkdownContent
                              content={msg.content}
                              isUser={isUser}
                            />
                          </div>

                          <div
                            className={`flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 ${
                              isUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity cursor-pointer ml-1"
                              title="Copy message"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="size-2.5 text-status-ready" />
                              ) : (
                                <Copy className="size-2.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isUser && (
                          <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg mt-0.5">
                            <User className="size-3.5" />
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center py-20 text-center">
                    <p className="text-muted-foreground text-xs">
                      No messages recorded for this session.
                    </p>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </ScrollArea>

            {/* Live Agent Input Composer */}
            <div className="border-t border-border/80 bg-card/80 p-3 space-y-2">
              <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={agentReply}
                  onChange={(e) => setAgentReply(e.target.value)}
                  placeholder={
                    isAgentActive
                      ? "Send message as human support agent..."
                      : "Type a response (sending will automatically activate agent takeover)..."
                  }
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!agentReply.trim() || sendMessageMutation.isPending}
                  className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-2xs font-medium"
                >
                  <Send className="size-3" />
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div>
              <MessageSquareText className="text-muted-foreground/40 mx-auto mb-2 size-6" />
              <p className="text-xs font-medium text-foreground">
                No session selected
              </p>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Choose a conversation on the left to review the full message transcript.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
