import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateBotMutation } from "@/hooks/use-api"
import { toast } from "sonner"
import { ArrowLeft, Bot, Loader2 } from "lucide-react"

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful support assistant. Answer questions based on the uploaded documentation. Be concise and accurate. If you don't know the answer, say so honestly."

export function CreateBotPage() {
  const navigate = useNavigate()
  const createBot = useCreateBotMutation()
  const [name, setName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createBot.mutate(
      { name: name.trim(), system_prompt: systemPrompt || undefined },
      {
        onSuccess: (bot) => {
          toast.success("Bot created", {
            description: `"${bot.name}" is ready for configuration.`,
          })
          navigate(`/dashboard/bots/${bot.id}`)
        },
        onError: (err) => {
          toast.error("Failed to create bot", {
            description: err.message,
          })
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to Bots
      </button>

      <Card>
        <CardHeader>
          <div className="bg-primary/10 mb-1 flex size-9 items-center justify-center rounded-lg">
            <Bot className="text-primary size-4.5" />
          </div>
          <CardTitle className="text-base font-semibold">Create Bot</CardTitle>
          <CardDescription className="text-xs">
            Give your bot a name and set its behavior. You can configure the
            widget appearance later in Settings.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Bot Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Support Bot"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="system-prompt" className="text-xs font-medium">
                System Prompt
              </Label>
              <Textarea
                id="system-prompt"
                placeholder="Instructions for how the bot should behave..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="text-sm leading-relaxed"
              />
              <p className="text-muted-foreground text-[11px]">
                This tells the bot how to respond. The default prompt works well
                for most support use cases.
              </p>
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!name.trim() || createBot.isPending}
              className="gap-1.5"
            >
              {createBot.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bot className="size-3.5" />
              )}
              Create Bot
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
