import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  useUpdateBotMutation,
  useUpdateWidgetConfigMutation,
  useDeleteBotMutation,
} from "@/hooks/use-api"
import { WidgetConfigForm } from "@/components/widget-config-form"
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
import { Trash2, Loader2, AlertTriangle } from "lucide-react"

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
          toast.success("Widget config saved")
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
      {/* Widget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Widget Configuration
          </CardTitle>
          <CardDescription className="text-xs">
            Customize how the chat widget looks and behaves on your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WidgetConfigForm value={config} onChange={handleConfigChange} />
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            size="sm"
            disabled={!hasConfigChanges || updateConfig.isPending}
            onClick={handleSaveConfig}
            className="gap-1.5"
          >
            {updateConfig.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            Save Widget Config
          </Button>
        </CardFooter>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">System Prompt</CardTitle>
          <CardDescription className="text-xs">
            Instructions that define how the bot responds to visitors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPrompt}
            onChange={(e) => {
              setSystemPrompt(e.target.value)
              setHasPromptChanges(true)
            }}
            rows={5}
            className="text-sm leading-relaxed"
          />
        </CardContent>
        <CardFooter className="justify-end">
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
            Save Prompt
          </Button>
        </CardFooter>
      </Card>

      {/* Danger Zone */}
      <Card className="ring-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">
            Permanently delete this bot and all its data. This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete Bot
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Delete Bot</DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently delete <strong>{bot.name}</strong> and all
              associated documents, conversations, and embeddings. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-xs">
              Type <strong>{bot.name}</strong> to confirm:
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={bot.name}
              className="h-8 text-sm"
            />
          </div>

          <DialogFooter>
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
              Delete Bot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
