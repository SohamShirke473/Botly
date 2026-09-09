import { useParams, useNavigate } from "react-router-dom"
import { useBotQuery } from "@/hooks/use-api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Settings,
  MessageSquareText,
  Code2,
  Database,
  Bot as BotIcon,
  Clock,
  BarChart3,
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
          <Skeleton className="h-100 w-full rounded-xl" />
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Header Area */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground mb-3 flex cursor-pointer items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Bots</span>
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="bg-primary/5 text-primary ring-primary/10 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
              <BotIcon className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-foreground text-xl font-bold tracking-tight">
                  {bot.name}
                </h1>
                <span className="bg-status-ready/15 text-status-ready border-status-ready/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
                  <span className="bg-status-ready size-1.5 animate-pulse rounded-full" />
                  Active
                </span>
              </div>
              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="text-muted-foreground/70 size-3" />
                  Created {new Date(bot.created_at).toLocaleDateString()}
                </span>
                {bot.system_prompt && (
                  <>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground/80 text-[11px]">
                      Custom Prompt Configured
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Hub */}
      <Tabs defaultValue="knowledge-base" className="space-y-6">
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="bg-muted/60 border-border/70 inline-flex h-10 items-center gap-1 rounded-xl border p-1">
            <TabsTrigger
              value="knowledge-base"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-active:bg-card data-[state=active]:bg-card data-active:text-foreground data-[state=active]:text-foreground data-active:border-border/60 data-[state=active]:border-border/60 cursor-pointer gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-medium transition-all data-active:font-semibold data-active:shadow-xs data-[state=active]:font-semibold data-[state=active]:shadow-xs"
            >
              <Database className="size-3.5 shrink-0" />
              <span>Knowledge Base</span>
            </TabsTrigger>
            <TabsTrigger
              value="install"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-active:bg-card data-[state=active]:bg-card data-active:text-foreground data-[state=active]:text-foreground data-active:border-border/60 data-[state=active]:border-border/60 cursor-pointer gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-medium transition-all data-active:font-semibold data-active:shadow-xs data-[state=active]:font-semibold data-[state=active]:shadow-xs"
            >
              <Code2 className="size-3.5 shrink-0" />
              <span>Install Widget</span>
            </TabsTrigger>
            <TabsTrigger
              value="conversations"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-active:bg-card data-[state=active]:bg-card data-active:text-foreground data-[state=active]:text-foreground data-active:border-border/60 data-[state=active]:border-border/60 cursor-pointer gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-medium transition-all data-active:font-semibold data-active:shadow-xs data-[state=active]:font-semibold data-[state=active]:shadow-xs"
            >
              <MessageSquareText className="size-3.5 shrink-0" />
              <span>Conversations</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-active:bg-card data-[state=active]:bg-card data-active:text-foreground data-[state=active]:text-foreground data-active:border-border/60 data-[state=active]:border-border/60 cursor-pointer gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-medium transition-all data-active:font-semibold data-active:shadow-xs data-[state=active]:font-semibold data-[state=active]:shadow-xs"
            >
              <BarChart3 className="size-3.5 shrink-0" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-active:bg-card data-[state=active]:bg-card data-active:text-foreground data-[state=active]:text-foreground data-active:border-border/60 data-[state=active]:border-border/60 cursor-pointer gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-medium transition-all data-active:font-semibold data-active:shadow-xs data-[state=active]:font-semibold data-[state=active]:shadow-xs"
            >
              <Settings className="size-3.5 shrink-0" />
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
