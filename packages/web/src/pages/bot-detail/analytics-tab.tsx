import { useMemo } from "react"
import { useBotStatsQuery } from "@/hooks/use-api"
import type { Bot } from "types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  Users,
  FileText,
  Layers,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react"

export function AnalyticsTab({ bot }: { bot: Bot }) {
  const statsQuery = useBotStatsQuery(bot.id)

  const summary = useMemo(() => {
    if (!statsQuery.data) return { peak: 0, peakDate: "", total14d: 0, avg14d: 0 }
    const list = statsQuery.data.messagesPerDay || []
    let peak = 0
    let peakDate = ""
    let sum = 0
    for (const d of list) {
      sum += d.count
      if (d.count > peak) {
        peak = d.count
        peakDate = d.date
      }
    }
    const avg14d = list.length > 0 ? Math.round(sum / list.length) : 0
    return { peak, peakDate, total14d: sum, avg14d }
  }, [statsQuery.data])

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
      <div className="rounded-xl border border-dashed py-16 text-center bg-card">
        <TrendingUp className="text-muted-foreground/40 mx-auto mb-2 size-6" />
        <p className="text-sm font-semibold text-foreground">
          Unable to load analytics
        </p>
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
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Total Messages
            </CardTitle>
            <div className="bg-primary/5 text-primary p-1.5 rounded-md">
              <MessageSquare className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
              {stats.totalMessages.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Cumulative visitor and assistant turns
            </p>
          </CardContent>
        </Card>

        {/* Active Conversations */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Conversations
            </CardTitle>
            <div className="bg-primary/5 text-primary p-1.5 rounded-md">
              <Users className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
              {stats.activeConversations.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Independent visitor support sessions
            </p>
          </CardContent>
        </Card>

        {/* Ready Documents */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Indexed Documents
            </CardTitle>
            <div className="bg-primary/5 text-primary p-1.5 rounded-md">
              <FileText className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
              {stats.readyDocuments}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                / {stats.totalDocuments}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Available for semantic search
            </p>
          </CardContent>
        </Card>

        {/* Vector Chunks */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              Vector Chunks
            </CardTitle>
            <div className="bg-primary/5 text-primary p-1.5 rounded-md">
              <Layers className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
              {stats.totalChunks.toLocaleString()}
            </div>
            <p className="text-muted-foreground mt-1 text-[11px]">
              Embedded 1024-dim vectors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 14-Day Message Volume Activity Chart */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity className="size-4 text-primary" />
                <span>Message Volume (Last 14 Days)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Daily conversational query and response volume handled by this bot.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] gap-1">
                <Calendar className="size-3" />
                <span>14 Days</span>
              </Badge>
              {summary.total14d > 0 && (
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {summary.total14d} turns total
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {dailyData.length > 0 ? (
            <div className="space-y-4">
              {/* Reference Grid & Column Bars */}
              <div className="relative h-52 flex items-end gap-2 pt-6 pb-2 border-b border-border/60">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-6 border-b border-dashed border-border/40 pointer-events-none" />
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/40 pointer-events-none" />

                {dailyData.map((item) => {
                  const percentage = Math.round((item.count / maxCount) * 100)
                  const heightPercent = Math.max(percentage, 5)

                  return (
                    <div
                      key={item.date}
                      className="group relative flex flex-1 flex-col items-center h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-popover border border-border text-foreground px-2 py-0.5 rounded text-[10px] font-mono shadow-xs">
                        {item.count} messages
                      </div>

                      {/* Bar */}
                      <div
                        className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-all duration-150 cursor-pointer"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Date Axis Labels */}
              <div className="flex gap-2 text-muted-foreground font-mono text-[10px]">
                {dailyData.map((item) => (
                  <div key={item.date} className="flex-1 text-center truncate">
                    {item.date.slice(5)}
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              {summary.total14d > 0 && (
                <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>
                    Daily Average:{" "}
                    <strong className="text-foreground font-mono">
                      {summary.avg14d}
                    </strong>{" "}
                    messages/day
                  </span>
                  <span>
                    Peak Day:{" "}
                    <strong className="text-foreground font-mono">
                      {summary.peak}
                    </strong>{" "}
                    ({summary.peakDate})
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-center">
              <Calendar className="text-muted-foreground/40 mb-2 size-5" />
              <p className="text-xs font-semibold text-foreground">
                No activity recorded in the last 14 days
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px] max-w-sm">
                Embed the widget script on your site to begin logging conversations
                and telemetry metrics.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
