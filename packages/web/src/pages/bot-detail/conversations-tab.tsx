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

if (
  typeof document !== "undefined" &&
  !document.getElementById("botly-md-styles")
) {
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
        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 text-[9px] font-semibold tracking-wider text-amber-600 dark:text-amber-400">
          <span className="size-1 animate-ping rounded-full bg-amber-500" />
          Awaiting Agent
        </span>
      )
    case "agent_active":
      return (
        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-1.5 text-[9px] font-semibold tracking-wider text-blue-600 dark:text-blue-400">
          <span className="size-1 rounded-full bg-blue-500" />
          Agent Active
        </span>
      )
    case "resolved":
      return (
        <span className="py-0.2 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 text-[9px] font-medium tracking-wider text-emerald-600 dark:text-emerald-400">
          Resolved
        </span>
      )
    case "bot":
    default:
      return (
        <span className="py-0.2 bg-muted text-muted-foreground border-border/60 inline-flex items-center gap-1 rounded-full border px-1.5 text-[9px] font-medium tracking-wider">
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
    return (
      <p className="min-w-0 leading-relaxed wrap-break-word whitespace-pre-wrap">
        {content}
      </p>
    )
  }

  return (
    <div
      className="min-w-0 text-xs leading-relaxed wrap-anywhere"
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
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      )
    }
  }

  return (
    <div className="border-border/80 bg-card flex h-165 max-h-[calc(100vh-200px)] overflow-hidden rounded-xl border shadow-xs">
      {/* Conversation Sessions List */}
      <div className="border-border/80 bg-muted/10 flex w-80 shrink-0 flex-col border-r">
        <div className="border-border/80 flex items-center justify-between border-b px-3.5 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Sessions
            </h4>
            <div className="text-muted-foreground flex items-center gap-1 font-mono text-[10px]">
              <span
                className={`size-1.5 rounded-full ${
                  isWsConnected
                    ? "animate-pulse bg-emerald-500"
                    : "bg-amber-500"
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
            <div className="space-y-1 p-1.5">
              {convosQuery.data.map((convo) => {
                const isSelected = activeId === convo.id
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedId(convo.id)}
                    className={`w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-accent text-accent-foreground border-foreground border-l-2 font-medium shadow-2xs"
                        : "hover:bg-muted/50 text-muted-foreground border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-foreground truncate text-xs font-semibold">
                        {formatVisitorDisplay(convo)}
                      </span>
                      <span className="text-muted-foreground/70 shrink-0 font-mono text-[10px]">
                        {new Date(convo.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-1">
                      <p className="text-muted-foreground/80 flex-1 truncate text-[11px] leading-normal">
                        {convo.last_message || "No messages"}
                      </p>
                    </div>

                    <div className="text-muted-foreground/60 mt-1.5 flex items-center justify-between font-mono text-[10px]">
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
                <p className="text-foreground text-xs font-medium">
                  No conversations yet
                </p>
                <p className="text-muted-foreground mt-0.5 max-w-45 text-[11px]">
                  Visitor chats will appear here once the widget is active.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Transcript & Live Agent Console */}
      <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeId ? (
          <>
            {/* Header with status toggle & actions */}
            <div className="border-border/80 bg-card/60 flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-foreground truncate text-xs font-semibold">
                  {activeConvo
                    ? formatVisitorDisplay(activeConvo)
                    : "Transcript"}
                </span>
                <span className="text-border">•</span>
                <span className="text-muted-foreground hidden truncate font-mono text-[11px] sm:inline">
                  {activeConvo?.visitor_id}
                </span>
                {renderStatusBadge(activeConvo?.status)}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isAgentActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusToggle("bot")}
                    disabled={updateStatusMutation.isPending}
                    className="h-7 cursor-pointer gap-1 text-xs"
                  >
                    <RotateCcw className="size-3" />
                    Return to AI
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleStatusToggle("agent_active")}
                    disabled={updateStatusMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 cursor-pointer gap-1 text-xs font-medium shadow-2xs"
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
                    className="h-7 cursor-pointer gap-1 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="size-3" />
                    Resolve
                  </Button>
                )}

                <Badge variant="secondary" className="font-mono text-[10px]">
                  {messagesQuery.data?.length ?? 0} msgs
                </Badge>
              </div>
            </div>

            {/* AI Paused Notice Banner */}
            {(isAgentActive || isWaitingAgent) && (
              <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                  {isWaitingAgent
                    ? "Visitor requested human support. AI is standing by."
                    : "Human takeover active. AI bot is paused for this session."}
                </span>
                {isWaitingAgent && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusToggle("agent_active")}
                    className="h-6 bg-amber-600 px-2.5 text-[11px] text-white hover:bg-amber-700"
                  >
                    Accept & Chat
                  </Button>
                )}
              </div>
            )}

            {/* Transcript Messages Area */}
            <ScrollArea className="min-h-0 flex-1 p-4">
              <div className="mx-auto max-w-3xl space-y-4 py-2">
                {messagesQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-3/4 rounded-xl" />
                    ))}
                  </div>
                ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                  messagesQuery.data.map((msg) => {
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
                            className={`flex items-center gap-1.5 text-[10px] font-medium ${
                              isUser
                                ? "text-muted-foreground justify-end"
                                : "text-foreground/75 justify-start"
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
                                  ? "bg-primary/10 text-foreground border-primary/30 rounded-tl-xs border"
                                  : "bg-card text-foreground border-border/80 rounded-tl-xs border"
                            }`}
                          >
                            <MarkdownContent
                              content={msg.content}
                              isUser={isUser}
                            />
                          </div>

                          <div
                            className={`text-muted-foreground/60 flex items-center gap-1.5 font-mono text-[10px] ${
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
                              className="hover:text-foreground ml-1 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                              title="Copy message"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="text-status-ready size-2.5" />
                              ) : (
                                <Copy className="size-2.5" />
                              )}
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
            <div className="border-border/80 bg-card/80 space-y-2 border-t p-3">
              <form
                onSubmit={handleSendReply}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={agentReply}
                  onChange={(e) => setAgentReply(e.target.value)}
                  placeholder={
                    isAgentActive
                      ? "Send message as human support agent..."
                      : "Type a response (sending will automatically activate agent takeover)..."
                  }
                  className="border-border bg-background focus:ring-primary flex-1 rounded-lg border px-3 py-2 text-xs focus:ring-1 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!agentReply.trim() || sendMessageMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 cursor-pointer gap-1.5 text-xs font-medium shadow-2xs"
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
              <p className="text-foreground text-xs font-medium">
                No session selected
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Choose a conversation on the left to review the full message
                transcript.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
