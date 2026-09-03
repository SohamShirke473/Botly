import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useBotQuery } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ArrowLeft,
  Settings,
  MessageSquareText,
  Code2,
  Database,
  Bot as BotIcon,
  Clock,
  BarChart3,
  Copy,
  Check,
} from "lucide-react"

import { KnowledgeBaseTab } from "./bot-detail/knowledge-base-tab"
import { InstallTab } from "./bot-detail/install-tab"
import { ConversationsTab } from "./bot-detail/conversations-tab"
import { SettingsTab } from "./bot-detail/settings-tab"
import { AnalyticsTab } from "./bot-detail/analytics-tab"

export function BotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const botQuery = useBotQuery(id)
  const [copiedId, setCopiedId] = useState(false)

  const copyId = (botId: string) => {
    navigator.clipboard.writeText(botId)
    setCopiedId(true)
    toast.success("Bot ID copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (botQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (botQuery.isError || !botQuery.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed py-20 text-center">
          <BotIcon className="text-muted-foreground/40 mx-auto mb-2 size-6" />
          <p className="text-sm font-semibold">Bot not found</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            This bot may have been deleted or your account lacks permission.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Bots</span>
          </Button>
        </div>
      </div>
    )
  }

  const bot = botQuery.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      {/* Header Area */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Bots</span>
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-primary/5 text-primary flex size-11 items-center justify-center rounded-xl ring-1 ring-primary/10 shrink-0">
              <BotIcon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {bot.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-medium bg-status-ready/10 text-status-ready gap-1"
                >
                  <span className="size-1.5 rounded-full bg-status-ready animate-pulse" />
                  Active
                </Badge>
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => copyId(bot.id)}
                  className="font-mono text-[11px] hover:text-foreground inline-flex items-center gap-1 bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded border border-border transition-colors cursor-pointer"
                  title="Click to copy full Bot ID"
                >
                  <span>{bot.id.slice(0, 8)}...</span>
                  {copiedId ? (
                    <Check className="size-2.5 text-status-ready" />
                  ) : (
                    <Copy className="size-2.5 text-muted-foreground" />
                  )}
                </button>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="size-3 text-muted-foreground/70" />
                  Created {new Date(bot.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Hub */}
      <Tabs defaultValue="knowledge-base" className="space-y-4">
        <div className="border-b border-border/80 pb-px overflow-x-auto">
          <TabsList className="bg-transparent p-0 gap-1 h-9 justify-start">
            <TabsTrigger
              value="knowledge-base"
              className="gap-1.5 text-xs data-active:border-b-2 data-active:border-foreground data-active:bg-transparent rounded-none px-3 py-1.5"
            >
              <Database className="size-3.5" />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger
              value="install"
              className="gap-1.5 text-xs data-active:border-b-2 data-active:border-foreground data-active:bg-transparent rounded-none px-3 py-1.5"
            >
              <Code2 className="size-3.5" />
              <span>Install Widget</span>
            </TabsTrigger>
            <TabsTrigger
              value="conversations"
              className="gap-1.5 text-xs data-active:border-b-2 data-active:border-foreground data-active:bg-transparent rounded-none px-3 py-1.5"
            >
              <MessageSquareText className="size-3.5" />
              <span>Conversations</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-1.5 text-xs data-active:border-b-2 data-active:border-foreground data-active:bg-transparent rounded-none px-3 py-1.5"
            >
              <BarChart3 className="size-3.5" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-1.5 text-xs data-active:border-b-2 data-active:border-foreground data-active:bg-transparent rounded-none px-3 py-1.5"
            >
              <Settings className="size-3.5" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="knowledge-base">
          <KnowledgeBaseTab bot={bot} />
        </TabsContent>

        <TabsContent value="install">
          <InstallTab bot={bot} />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationsTab bot={bot} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab bot={bot} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab bot={bot} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
