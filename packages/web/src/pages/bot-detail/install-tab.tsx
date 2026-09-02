import { useState } from "react"
import { useEmbedSnippetQuery } from "@/hooks/use-api"
import { WidgetPreview } from "@/components/widget-preview"
import { DEFAULT_WIDGET_CONFIG } from "types"
import type { Bot } from "types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export function InstallTab({ bot }: { bot: Bot }) {
  const [copied, setCopied] = useState(false)
  const snippetQuery = useEmbedSnippetQuery(bot.id)

  const defaultSnippet = `<script\n  src="${window.location.origin}/widget.js"\n  data-bot-id="${bot.id}"\n  async\n></script>`
  const snippet = snippetQuery.data?.snippet || defaultSnippet

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const config = bot.widget_config || DEFAULT_WIDGET_CONFIG

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Code Snippet */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Embed Script</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Add this snippet to your website's HTML, just before the closing
            <code className="bg-muted mx-0.5 rounded px-1 py-0.5 font-mono text-[11px]">
              &lt;/body&gt;
            </code>
            tag.
          </p>
        </div>

        <div className="group relative">
          <pre className="overflow-x-auto rounded-xl border bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-950">
            {snippet}
          </pre>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            {copied ? (
              <Check className="text-status-ready size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-muted-foreground text-[11px]">
            <strong className="text-foreground">Bot ID:</strong>{" "}
            <code className="font-mono">{bot.id}</code>
          </p>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Live Preview</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            This preview reads the same{" "}
            <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
              widget_config
            </code>{" "}
            JSON as the real widget — what you see here is exactly what visitors
            will see.
          </p>
        </div>
        <WidgetPreview config={config} />
      </div>
    </div>
  )
}
