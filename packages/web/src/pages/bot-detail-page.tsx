import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useBotQuery,
  useDocumentsQuery,
  useConversationsQuery,
  useMessagesQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useDeleteBotMutation,
  useUpdateBotMutation,
  useUpdateWidgetConfigMutation,
} from "@/hooks/use-api"
import { WidgetConfigForm } from "@/components/widget-config-form"
import { WidgetPreview } from "@/components/widget-preview"
import { DEFAULT_WIDGET_CONFIG } from "types"
import type { WidgetConfig, Bot, Document } from "types"
import { toast } from "sonner"
import {
  ArrowLeft,
  FileText,
  Upload,
  Trash2,
  Copy,
  Check,
  Loader2,
  Settings,
  MessageSquareText,
  Code2,
  Database,
  AlertTriangle,
  Bot as BotIcon,
  Clock,
  ExternalLink,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-status-pending/10 text-status-pending",
  },
  processing: {
    label: "Processing",
    className: "bg-status-processing/10 text-status-processing",
  },
  ready: {
    label: "Ready",
    className: "bg-status-ready/10 text-status-ready",
  },
  failed: {
    label: "Failed",
    className: "bg-status-failed/10 text-status-failed",
  },
}

// ─── Knowledge Base Tab ─────────────────────────────────────────────

function KnowledgeBaseTab({ bot }: { bot: Bot }) {
  const docsQuery = useDocumentsQuery(bot.id)
  const uploadMutation = useUploadDocumentMutation()
  const deleteMutation = useDeleteDocumentMutation()
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  // Poll for processing documents
  useEffect(() => {
    if (!docsQuery.data) return
    const hasProcessing = docsQuery.data.some(
      (d) => d.status === "processing" || d.status === "pending"
    )
    if (hasProcessing) {
      pollRef.current = setInterval(() => {
        docsQuery.refetch()
      }, 3000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [docsQuery])

  const handleUpload = useCallback(
    (file: File) => {
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 90) {
            clearInterval(interval)
            return 90
          }
          return p + 10
        })
      }, 200)

      uploadMutation.mutate(
        { botId: bot.id, file },
        {
          onSuccess: () => {
            clearInterval(interval)
            setUploadProgress(100)
            setTimeout(() => setUploadProgress(0), 500)
            toast.success("Document uploaded", {
              description: `"${file.name}" is being processed.`,
            })
          },
          onError: (err) => {
            clearInterval(interval)
            setUploadProgress(0)
            toast.error("Upload failed", { description: err.message })
          },
        }
      )
    },
    [bot.id, uploadMutation]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  const handleDelete = (doc: Document) => {
    deleteMutation.mutate(
      { botId: bot.id, documentId: doc.id },
      {
        onSuccess: () => {
          toast.success("Document deleted", {
            description: `"${doc.filename}" has been removed.`,
          })
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.csv,.json"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ""
          }}
        />
        <Upload
          className={`mx-auto mb-2 size-5 ${
            dragOver ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <p className="text-sm font-medium">
          {dragOver ? "Drop to upload" : "Upload documents"}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Drag & drop or click to browse. PDF, TXT, MD, CSV, JSON.
        </p>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <Progress value={uploadProgress} className="h-1.5" />
      )}

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Or paste a URL to scrape..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="h-8 flex-1 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!urlInput.trim()}
          onClick={() => {
            if (!urlInput.trim()) return
            const blob = new Blob([""], { type: "text/plain" })
            const file = new File([blob], `${urlInput.trim()}.url`, {
              type: "text/plain",
            })
            handleUpload(file)
            setUrlInput("")
          }}
          className="gap-1.5"
        >
          <ExternalLink className="size-3.5" />
          Add URL
        </Button>
      </div>

      {/* Documents Table */}
      {docsQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : docsQuery.data && docsQuery.data.length > 0 ? (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">File</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Chunks</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docsQuery.data.map((doc, i) => {
                const status =
                  STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
                return (
                  <TableRow
                    key={doc.id}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="text-muted-foreground size-3.5" />
                        <span className="text-xs font-medium">
                          {doc.filename}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium ${status.className}`}
                      >
                        {(doc.status === "processing" ||
                          doc.status === "pending") && (
                          <Loader2 className="mr-1 size-2.5 animate-spin" />
                        )}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground font-mono text-xs">
                        {doc.chunk_count ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {doc.source_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(doc)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <Database className="text-muted-foreground/50 mx-auto mb-2 size-5" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Upload files or add URLs to build your knowledge base.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Install Tab ────────────────────────────────────────────────────

function InstallTab({ bot }: { bot: Bot }) {
  const [copied, setCopied] = useState(false)
  const snippet = `<script
  src="${window.location.origin}/widget.js"
  data-bot-id="${bot.id}"
  async
></script>`

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

// ─── Conversations Tab ──────────────────────────────────────────────

function ConversationsTab({ bot }: { bot: Bot }) {
  const convosQuery = useConversationsQuery(bot.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? convosQuery.data?.[0]?.id ?? null
  const messagesQuery = useMessagesQuery(activeId ?? undefined)

  return (
    <div className="flex h-[600px] rounded-xl border">
      {/* Conversation List */}
      <div className="w-72 shrink-0 border-r">
        <div className="border-b px-3 py-2.5">
          <h4 className="text-xs font-semibold">
            Conversations ({convosQuery.data?.length ?? 0})
          </h4>
        </div>
        <ScrollArea className="h-[calc(600px-41px)]">
          {convosQuery.isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : convosQuery.data && convosQuery.data.length > 0 ? (
            <div className="p-1">
              {convosQuery.data.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeId === convo.id
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="max-w-[120px] truncate text-xs font-medium">
                      {convo.visitor_id}
                    </span>
                    <span className="font-mono text-[10px]">
                      {new Date(convo.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] opacity-70">
                    {convo.last_message || "No messages yet"}
                  </p>
                  <span className="text-[10px] opacity-50">
                    {convo.message_count} messages
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center">
                <MessageSquareText className="text-muted-foreground/50 mx-auto mb-1 size-4" />
                <p className="text-muted-foreground text-xs">
                  No conversations
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Transcript */}
      <div className="flex flex-1 flex-col">
        {selectedId ? (
          <>
            <div className="border-b px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Transcript</span>
                <Badge variant="secondary" className="text-[10px]">
                  {messagesQuery.data?.length ?? 0} messages
                </Badge>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              {messagesQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-3/4 rounded-lg" />
                  ))}
                </div>
              ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {messagesQuery.data.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`mt-1 text-[10px] opacity-60 ${
                            msg.role === "user" ? "text-right" : ""
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-xs">
                    No messages in this conversation.
                  </p>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquareText className="text-muted-foreground/50 mx-auto mb-1 size-5" />
              <p className="text-muted-foreground text-xs">
                Select a conversation to view its transcript.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────

function SettingsTab({ bot }: { bot: Bot }) {
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

// ─── Bot Detail Page ────────────────────────────────────────────────

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

        <TabsContent value="settings">
          <SettingsTab bot={bot} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
