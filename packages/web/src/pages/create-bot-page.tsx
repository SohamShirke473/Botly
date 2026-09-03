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
import { ArrowLeft, Bot, Loader2, Sparkles, Plus } from "lucide-react"

const PROMPT_PRESETS = [
  {
    name: "Customer Support",
    prompt:
      "You are a helpful support assistant. Answer questions based on the uploaded documentation. Be concise, polite, and accurate. If you don't know the answer, say so honestly.",
  },
  {
    name: "Technical Docs",
    prompt:
      "You are a technical documentation specialist. Provide precise code references, API details, and step-by-step guidance grounded strictly in the provided knowledge base.",
  },
  {
    name: "Product FAQ",
    prompt:
      "You are a product guide. Help visitors find pricing, feature specifications, and common troubleshooting answers based on our company materials.",
  },
]

export function CreateBotPage() {
  const navigate = useNavigate()
  const createBot = useCreateBotMutation()
  const [name, setName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[0].prompt)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createBot.mutate(
      { name: name.trim(), system_prompt: systemPrompt || undefined },
      {
        onSuccess: (bot) => {
          toast.success("Bot created", {
            description: `"${bot.name}" is ready for documents and setup.`,
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
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Bots</span>
      </button>

      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <div className="bg-primary/5 text-primary mb-2 flex size-9 items-center justify-center rounded-lg ring-1 ring-primary/10">
            <Bot className="size-4.5" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground">
            Create New Bot
          </CardTitle>
          <CardDescription className="text-xs">
            Set up an assistant personality and name. You can upload documents
            and configure widget appearance immediately after creation.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {/* Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">
                Bot Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Acme Support Assistant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="h-8.5 text-xs bg-background"
                autoFocus
              />
            </div>

            {/* Prompt Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="system-prompt"
                  className="text-xs font-medium"
                >
                  System Instructions
                </Label>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {systemPrompt.length} / 4000
                </span>
              </div>

              {/* Starter Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1 flex items-center gap-1">
                  <Sparkles className="size-3 text-primary/70" />
                  Presets:
                </span>
                {PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSystemPrompt(preset.prompt)}
                    className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <Textarea
                id="system-prompt"
                placeholder="Instructions for how the bot should behave and answer..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                maxLength={4000}
                className="text-xs leading-relaxed bg-background font-mono text-[12px]"
              />
              <p className="text-muted-foreground text-[11px]">
                Defines tone, scope, and boundary conditions when answering customer
                queries.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-6 py-3">
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
              className="gap-1.5 shadow-xs"
            >
              {createBot.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              <span>Create Bot</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
