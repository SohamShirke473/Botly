import { useState } from "react"
import { useConversationsQuery, useMessagesQuery } from "@/hooks/use-api"
import type { Bot } from "types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquareText } from "lucide-react"
import { renderMarkdown } from "@/lib/markdown"

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
    background: rgba(0,0,0,.08);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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

/* ── Markdown bubble ─────────────────────────────────────────────────── */
function MarkdownContent({
  content,
  isUser,
}: {
  content: string
  isUser: boolean
}) {
  if (isUser) {
    // User messages are plain text — no markdown rendering needed
    return <p className="min-w-0 wrap-break-word whitespace-pre-wrap">{content}</p>
  }

  return (
    <div
      className="min-w-0 wrap-anywhere leading-relaxed"
      // renderMarkdown() escapes all HTML before substitution — safe.
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

/* ── Main tab ────────────────────────────────────────────────────────── */
export function ConversationsTab({ bot }: { bot: Bot }) {
  const convosQuery = useConversationsQuery(bot.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? convosQuery.data?.[0]?.id ?? null
  const messagesQuery = useMessagesQuery(activeId ?? undefined)

  return (
    <div className="flex h-[600px] rounded-xl border">
      {/* Conversation List */}
      <div className="w-72 shrink-0 border-r">
        <div className="border-b px-3 py-2.5">
          <h4 className="text-xs font-semibold">
            Conversations ({convosQuery.data?.length ?? 0})
          </h4>
        </div>
        <ScrollArea className="h-[559px]">
          {convosQuery.isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : convosQuery.data && convosQuery.data.length > 0 ? (
            <div className="p-1">
              {convosQuery.data.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeId === convo.id
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="max-w-[120px] truncate text-xs font-medium">
                      {convo.visitor_id}
                    </span>
                    <span className="font-mono text-[10px]">
                      {new Date(convo.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] opacity-70">
                    {convo.last_message || "No messages yet"}
                  </p>
                  <span className="text-[10px] opacity-50">
                    {convo.message_count} messages
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center">
                <MessageSquareText className="text-muted-foreground/50 mx-auto mb-1 size-4" />
                <p className="text-muted-foreground text-xs">
                  No conversations
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Transcript */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeId ? (
          <>
            <div className="border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Transcript</span>
                <Badge variant="secondary" className="text-[10px]">
                  {messagesQuery.data?.length ?? 0} messages
                </Badge>
              </div>
            </div>
            {/* min-h-0 + flex-1 gives ScrollArea a bounded height inside the flex column */}
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 p-4">
                {messagesQuery.isLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-3/4 rounded-lg" />
                    ))}
                  </>
                ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                  <>
                    {messagesQuery.data.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex min-w-0 ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`min-w-0 max-w-[72%] rounded-xl px-3 py-2 text-xs ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          <MarkdownContent
                            content={msg.content}
                            isUser={msg.role === "user"}
                          />
                          <p
                            className={`mt-1 text-[10px] opacity-60 ${
                              msg.role === "user" ? "text-right" : ""
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-16">
                    <p className="text-muted-foreground text-xs">
                      No messages in this conversation.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquareText className="text-muted-foreground/50 mx-auto mb-1 size-5" />
              <p className="text-muted-foreground text-xs">
                Select a conversation to view its transcript.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
