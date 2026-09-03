import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useUpdateBotMutation,
  useUpdateWidgetConfigMutation,
  useDeleteBotMutation,
} from "@/hooks/use-api"
import { WidgetConfigForm } from "@/components/widget-config-form"
import { WidgetPreview } from "@/components/widget-preview"
import { DEFAULT_WIDGET_CONFIG } from "types"
import type { WidgetConfig, Bot } from "types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Trash2, Loader2, AlertTriangle, Save } from "lucide-react"

export function SettingsTab({ bot }: { bot: Bot }) {
  const navigate = useNavigate()
  const updateBot = useUpdateBotMutation()
  const updateConfig = useUpdateWidgetConfigMutation()
  const deleteBot = useDeleteBotMutation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(bot.system_prompt || "")
  const [config, setConfig] = useState<WidgetConfig>(
    bot.widget_config || DEFAULT_WIDGET_CONFIG
  )
  const [hasConfigChanges, setHasConfigChanges] = useState(false)
  const [hasPromptChanges, setHasPromptChanges] = useState(false)

  const [prevBot, setPrevBot] = useState(bot)
  if (bot !== prevBot) {
    setPrevBot(bot)
    setSystemPrompt(bot.system_prompt || "")
    setConfig(bot.widget_config || DEFAULT_WIDGET_CONFIG)
    setHasConfigChanges(false)
    setHasPromptChanges(false)
  }

  const handleConfigChange = (newConfig: WidgetConfig) => {
    setConfig(newConfig)
    setHasConfigChanges(true)
  }

  const handleSaveConfig = () => {
    updateConfig.mutate(
      { botId: bot.id, widget_config: config },
      {
        onSuccess: () => {
          setHasConfigChanges(false)
          toast.success("Widget configuration saved", {
            description: "Changes are live for all embedded widgets.",
          })
        },
        onError: (err) => {
          toast.error("Failed to save config", { description: err.message })
        },
      }
    )
  }

  const handleSavePrompt = () => {
    updateBot.mutate(
      { id: bot.id, data: { system_prompt: systemPrompt || null } },
      {
        onSuccess: () => {
          setHasPromptChanges(false)
          toast.success("System prompt saved")
        },
        onError: (err) => {
          toast.error("Failed to save prompt", { description: err.message })
        },
      }
    )
  }

  const handleDelete = () => {
    if (deleteConfirm !== bot.name) return
    deleteBot.mutate(bot.id, {
      onSuccess: () => {
        toast.success("Bot deleted", {
          description: `"${bot.name}" has been permanently deleted.`,
        })
        navigate("/dashboard")
      },
      onError: (err) => {
        toast.error("Failed to delete bot", { description: err.message })
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Widget Customization + Real-Time Simulator */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Widget Customization & Live Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Fine-tune theme colors, copy, and launcher position with real-time visual feedback.
              </CardDescription>
            </div>
            <Button
              size="sm"
              disabled={!hasConfigChanges || updateConfig.isPending}
              onClick={handleSaveConfig}
              className="gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              {updateConfig.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>Save Widget Config</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <WidgetConfigForm value={config} onChange={handleConfigChange} />
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-16">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Live Preview
                </span>
                <span className="text-[11px] font-mono text-muted-foreground/80">
                  {hasConfigChanges ? "Unsaved changes" : "Saved"}
                </span>
              </div>
              <WidgetPreview config={config} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt Instructions */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            System Instructions
          </CardTitle>
          <CardDescription className="text-xs">
            Instructions that define how the assistant reasons and responds to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={systemPrompt}
            onChange={(e) => {
              setSystemPrompt(e.target.value)
              setHasPromptChanges(true)
            }}
            rows={5}
            maxLength={4000}
            className="text-xs leading-relaxed font-mono text-[12px] bg-background"
          />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Grounding instructions & response boundaries</span>
            <span>{systemPrompt.length} / 4000</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t border-border/60 bg-muted/20 px-6 py-3">
          <Button
            size="sm"
            variant="outline"
            disabled={!hasPromptChanges || updateBot.isPending}
            onClick={handleSavePrompt}
            className="gap-1.5"
          >
            {updateBot.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            <span>Save System Prompt</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-destructive" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Permanently delete this bot and all indexed documents, vector embeddings,
            and conversation transcripts.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-destructive/20 pt-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Bot</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-foreground">
              Delete Bot
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              This will permanently delete <strong>{bot.name}</strong> along with
              all associated vector records and conversations. This action cannot
              be reversed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs text-foreground">
              Please type <strong>{bot.name}</strong> to confirm:
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={bot.name}
              className="h-8.5 text-xs font-mono"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirm("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirm !== bot.name || deleteBot.isPending}
              onClick={handleDelete}
              className="gap-1.5"
            >
              {deleteBot.isPending && (
                <Loader2 className="size-3.5 animate-spin" />
              )}
              <span>Permanently Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
