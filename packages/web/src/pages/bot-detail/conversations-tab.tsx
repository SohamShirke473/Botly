import { useState } from "react"
import { useConversationsQuery, useMessagesQuery } from "@/hooks/use-api"
import type { Bot } from "types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquareText, Bot as BotIcon, User, Copy, Check } from "lucide-react"
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

function formatVisitorName(visitorId: string): string {
  if (visitorId.startsWith("visitor-")) {
    return `Visitor #${visitorId.replace("visitor-", "").slice(0, 6)}`
  }
  return `Visitor #${visitorId.slice(0, 6)}`
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
  const activeId = selectedId ?? convosQuery.data?.[0]?.id ?? null
  const messagesQuery = useMessagesQuery(activeId ?? undefined)

  const activeConvo = convosQuery.data?.find((c) => c.id === activeId)

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    toast.success("Message copied")
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  return (
    <div className="flex h-[620px] max-h-[calc(100vh-220px)] rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Conversation Sessions List */}
      <div className="w-80 shrink-0 border-r border-border/80 flex flex-col bg-muted/10">
        <div className="border-b border-border/80 px-3.5 py-3 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Sessions
          </h4>
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
                        {formatVisitorName(convo.visitor_id)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">
                        {new Date(convo.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground/80 leading-normal">
                      {convo.last_message || "No messages"}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60 font-mono">
                      <span>{convo.visitor_id.slice(0, 10)}...</span>
                      <span>{convo.message_count} turns</span>
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

      {/* Message Transcript View */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {activeId ? (
          <>
            <div className="border-b border-border/80 px-4 py-3 flex items-center justify-between bg-card/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {activeConvo ? formatVisitorName(activeConvo.visitor_id) : "Transcript"}
                </span>
                <span className="text-border">•</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {activeConvo?.visitor_id}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {messagesQuery.data?.length ?? 0} messages
              </Badge>
            </div>

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
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg mt-0.5">
                            <BotIcon className="size-3.5" />
                          </div>
                        )}
                        <div className="group relative max-w-[76%] space-y-1">
                          <div
                            className={`rounded-xl px-3.5 py-2.5 text-xs shadow-2xs ${
                              isUser
                                ? "bg-primary text-primary-foreground rounded-tr-xs"
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
              </div>
            </ScrollArea>
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
