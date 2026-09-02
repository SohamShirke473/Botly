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
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (botQuery.isError || !botQuery.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-xl border border-dashed py-20 text-center">
          <BotIcon className="text-muted-foreground/50 mx-auto mb-2 size-5" />
          <p className="text-sm font-medium">Bot not found</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            This bot may have been deleted or you don't have access.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => navigate("/dashboard")}
          >
            Back to Bots
          </Button>
        </div>
      </div>
    )
  }

  const bot = botQuery.data

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Bots
        </button>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
            <BotIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{bot.name}</h1>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
              <span className="font-mono">{bot.id.slice(0, 8)}...</span>
              <span className="text-border">|</span>
              <Clock className="size-3" />
              <span>
                Created {new Date(bot.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="knowledge-base">
        <TabsList className="mb-4">
          <TabsTrigger value="knowledge-base" className="gap-1.5 text-xs">
            <Database className="size-3.5" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="install" className="gap-1.5 text-xs">
            <Code2 className="size-3.5" />
            Install
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-1.5 text-xs">
            <MessageSquareText className="size-3.5" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 text-xs">
            <BarChart3 className="size-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings className="size-3.5" />
            Settings
          </TabsTrigger>
        </TabsList>

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
