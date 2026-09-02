import { useBotStatsQuery } from "@/hooks/use-api"
import type { Bot } from "types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Users,
  FileText,
  Layers,
  TrendingUp,
  Calendar,
} from "lucide-react"

export function AnalyticsTab({ bot }: { bot: Bot }) {
  const statsQuery = useBotStatsQuery(bot.id)

  if (statsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <TrendingUp className="text-muted-foreground/50 mx-auto mb-2 size-6" />
        <p className="text-sm font-medium">Unable to load analytics</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {statsQuery.error?.message || "Please check back in a few moments."}
        </p>
      </div>
    )
  }

  const stats = statsQuery.data
  const dailyData = stats.messagesPerDay || []
  const maxCount = Math.max(...dailyData.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Total Messages
            </CardTitle>
            <MessageSquare className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              All visitor & assistant turns
            </p>
          </CardContent>
        </Card>

        {/* Active Conversations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Active Conversations
            </CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.activeConversations.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Individual visitor sessions
            </p>
          </CardContent>
        </Card>

        {/* Ready Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Indexed Documents
            </CardTitle>
            <FileText className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.readyDocuments}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                / {stats.totalDocuments}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Documents in ready status
            </p>
          </CardContent>
        </Card>

        {/* Vector Chunks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium">
              Vector Chunks
            </CardTitle>
            <Layers className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {stats.totalChunks.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Embedded 1024-dim vectors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 14-Day Message Activity Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="size-4 text-primary" />
                Message Activity (Last 14 Days)
              </CardTitle>
              <CardDescription className="text-xs">
                Daily conversational message volume handled by this chatbot.
              </CardDescription>
            </div>
            <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Calendar className="size-3" />
              <span>Past 14 days</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <div className="space-y-3">
              <div className="flex h-48 items-end gap-2 pt-4">
                {dailyData.map((item) => {
                  const percentage = Math.round((item.count / maxCount) * 100)
                  const heightPercent = Math.max(percentage, 6)
                  return (
                    <div
                      key={item.date}
                      className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <div className="text-muted-foreground text-[10px] opacity-0 transition-opacity group-hover:opacity-100 font-mono">
                        {item.count}
                      </div>
                      <div
                        className="bg-primary/85 hover:bg-primary w-full rounded-t-md transition-all duration-200"
                        style={{ height: `${heightPercent}%` }}
                        title={`${item.date}: ${item.count} messages`}
                      />
                      <span className="text-muted-foreground truncate text-[10px] font-mono">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <Calendar className="text-muted-foreground/40 mb-2 size-5" />
              <p className="text-xs font-medium">No activity in the last 14 days</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Embed the widget on your website to start collecting interaction metrics.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
