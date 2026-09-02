import { useState, useRef, useEffect, useCallback } from "react"
import {
  useDocumentsQuery,
  useUploadDocumentMutation,
  useSubmitUrlMutation,
  useDeleteDocumentMutation,
  useReprocessDocumentMutation,
} from "@/hooks/use-api"
import type { Bot, Document } from "types"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  Database,
  ExternalLink,
  RotateCw,
} from "lucide-react"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ready: {
    label: "Ready",
    className:
      "bg-status-ready/15 text-status-ready border-status-ready/20",
  },
  processing: {
    label: "Processing",
    className:
      "bg-status-processing/15 text-status-processing border-status-processing/20",
  },
  pending: {
    label: "Pending",
    className:
      "bg-status-pending/15 text-status-pending border-status-pending/20",
  },
  failed: {
    label: "Failed",
    className:
      "bg-status-failed/15 text-status-failed border-status-failed/20",
  },
}

export function KnowledgeBaseTab({ bot }: { bot: Bot }) {
  const docsQuery = useDocumentsQuery(bot.id)
  const uploadMutation = useUploadDocumentMutation()
  const submitUrlMutation = useSubmitUrlMutation()
  const deleteMutation = useDeleteDocumentMutation()
  const reprocessMutation = useReprocessDocumentMutation()
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
        onError: (err) => {
          toast.error("Delete failed", { description: err.message })
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
          disabled={!urlInput.trim() || submitUrlMutation.isPending}
          onClick={() => {
            const url = urlInput.trim()
            if (!url) return
            submitUrlMutation.mutate(
              { botId: bot.id, url },
              {
                onSuccess: () => {
                  toast.success("URL submitted", {
                    description: `"${url}" is queued for ingestion.`,
                  })
                  setUrlInput("")
                },
                onError: (err) => {
                  toast.error("Failed to add URL", { description: err.message })
                },
              }
            )
          }}
          className="gap-1.5"
        >
          {submitUrlMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ExternalLink className="size-3.5" />
          )}
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
                      <div className="flex items-center gap-1">
                        {doc.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              reprocessMutation.mutate(
                                { botId: bot.id, documentId: doc.id },
                                {
                                  onSuccess: () =>
                                    toast.success("Reprocessing started", {
                                      description: `"${doc.filename}" is being re-indexed.`,
                                    }),
                                  onError: (err) =>
                                    toast.error("Reprocess failed", {
                                      description: err.message,
                                    }),
                                }
                              )
                            }
                            disabled={reprocessMutation.isPending}
                            className="text-muted-foreground hover:text-foreground"
                            title="Retry ingestion"
                          >
                            <RotateCw className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(doc)}
                          disabled={deleteMutation.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
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
