import { useState } from "react"
import { useConversationsQuery, useMessagesQuery } from "@/hooks/use-api"
import type { Bot } from "types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquareText } from "lucide-react"

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
      <div className="flex flex-1 flex-col">
        {selectedId ? (
          <>
            <div className="border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Transcript</span>
                <Badge variant="secondary" className="text-[10px]">
                  {messagesQuery.data?.length ?? 0} messages
                </Badge>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {messagesQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-3/4 rounded-lg" />
                  ))}
                </div>
              ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {messagesQuery.data.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
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
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-xs">
                    No messages in this conversation.
                  </p>
                </div>
              )}
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
