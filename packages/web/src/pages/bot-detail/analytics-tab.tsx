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
    if (!statsQuery.data)
      return { peak: 0, peakDate: "", total14d: 0, avg14d: 0 }
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
      <div className="bg-card rounded-xl border border-dashed py-16 text-center">
        <TrendingUp className="text-muted-foreground/40 mx-auto mb-2 size-6" />
        <p className="text-foreground text-sm font-semibold">
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
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Total Messages
            </CardTitle>
            <div className="bg-primary/5 text-primary rounded-md p-1.5">
              <MessageSquare className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-mono text-2xl font-bold tracking-tight">
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
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Conversations
            </CardTitle>
            <div className="bg-primary/5 text-primary rounded-md p-1.5">
              <Users className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-mono text-2xl font-bold tracking-tight">
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
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Indexed Documents
            </CardTitle>
            <div className="bg-primary/5 text-primary rounded-md p-1.5">
              <FileText className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-mono text-2xl font-bold tracking-tight">
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
            <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Vector Chunks
            </CardTitle>
            <div className="bg-primary/5 text-primary rounded-md p-1.5">
              <Layers className="size-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-foreground font-mono text-2xl font-bold tracking-tight">
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
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Activity className="text-primary size-4" />
                <span>Message Volume (Last 14 Days)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Daily conversational query and response volume handled by this
                bot.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 font-mono text-[10px]">
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
              <div className="border-border/60 relative flex h-52 items-end gap-2 border-b pt-6 pb-2">
                {/* Horizontal guide lines */}
                <div className="border-border/40 pointer-events-none absolute inset-x-0 top-6 border-b border-dashed" />
                <div className="border-border/40 pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />

                {dailyData.map((item) => {
                  const percentage = Math.round((item.count / maxCount) * 100)
                  const heightPercent = Math.max(percentage, 5)

                  return (
                    <div
                      key={item.date}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="bg-popover border-border text-foreground pointer-events-none absolute -top-7 z-10 rounded border px-2 py-0.5 font-mono text-[10px] whitespace-nowrap opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
                        {item.count} messages
                      </div>

                      {/* Bar */}
                      <div
                        className="bg-primary/80 hover:bg-primary w-full cursor-pointer rounded-t-sm transition-all duration-150"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Date Axis Labels */}
              <div className="text-muted-foreground flex gap-2 font-mono text-[10px]">
                {dailyData.map((item) => (
                  <div key={item.date} className="flex-1 truncate text-center">
                    {item.date.slice(5)}
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              {summary.total14d > 0 && (
                <div className="text-muted-foreground border-border/60 flex flex-wrap items-center justify-between border-t pt-2 text-[11px]">
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
              <p className="text-foreground text-xs font-semibold">
                No activity recorded in the last 14 days
              </p>
              <p className="text-muted-foreground mt-0.5 max-w-sm text-[11px]">
                Embed the widget script on your site to begin logging
                conversations and telemetry metrics.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
