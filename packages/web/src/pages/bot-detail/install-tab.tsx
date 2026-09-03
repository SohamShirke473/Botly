import { useState } from "react"
import { useEmbedSnippetQuery } from "@/hooks/use-api"
import { WidgetPreview } from "@/components/widget-preview"
import { DEFAULT_WIDGET_CONFIG } from "types"
import type { Bot } from "types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Copy, Check, Terminal, CheckCircle2, ShieldCheck } from "lucide-react"

export function InstallTab({ bot }: { bot: Bot }) {
  const [copied, setCopied] = useState(false)
  const snippetQuery = useEmbedSnippetQuery(bot.id)

  const defaultSnippet = `<script\n  src="${window.location.origin}/widget.js"\n  data-bot-id="${bot.id}"\n  async\n></script>`
  const snippet = snippetQuery.data?.snippet || defaultSnippet

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success("Embed snippet copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const config = bot.widget_config || DEFAULT_WIDGET_CONFIG

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Code Snippet & Instructions */}
      <div className="lg:col-span-7 space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Embed Script on Your Site
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Copy and paste this script tag into your website HTML right before the
            closing <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag.
          </p>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/70">
            <div className="flex items-center gap-2">
              <Terminal className="size-3.5 text-zinc-400" />
              <span className="font-mono text-xs text-zinc-300">index.html</span>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              className="gap-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 h-6.5 text-[11px]"
            >
              {copied ? (
                <>
                  <Check className="text-status-ready size-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy Code</span>
                </>
              )}
            </Button>
          </div>
          <pre className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-200">
            {snippet}
          </pre>
        </div>

        {/* Step-by-step Installation Checklist */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Quick Verification Steps
          </h4>
          <ul className="space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-medium">1. Paste into your HTML</strong>
                <p className="text-[11px] mt-0.5">
                  Insert before the closing <code className="font-mono bg-muted px-1 rounded">&lt;/body&gt;</code> tag on any page you want the chatbot active.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-medium">2. Asynchronous and lightweight</strong>
                <p className="text-[11px] mt-0.5">
                  The script loads asynchronously without blocking page rendering or layout performance.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground font-medium">3. Monitor live transcripts</strong>
                <p className="text-[11px] mt-0.5">
                  Once visitors interact with the widget, inspect full chat transcripts on the Conversations tab.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Live Preview Simulator */}
      <div className="lg:col-span-5 space-y-2 lg:sticky lg:top-16">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live Embed Preview
        </span>
        <WidgetPreview config={config} />
      </div>
    </div>
  )
}
