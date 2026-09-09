import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
  Globe,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    className: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  ready: {
    label: "Ready",
    className: "bg-status-ready/10 text-status-ready border-status-ready/20",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    className:
      "bg-status-processing/10 text-status-processing border-status-processing/20",
    icon: Loader2,
  },
  pending: {
    label: "Pending",
    className:
      "bg-status-pending/10 text-status-pending border-status-pending/20",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    className: "bg-status-failed/10 text-status-failed border-status-failed/20",
    icon: AlertCircle,
  },
}

function getDocumentIcon(sourceType: string, filename: string) {
  if (sourceType === "url") return <Globe className="size-3.5 text-blue-500" />
  if (filename.endsWith(".json") || filename.endsWith(".csv"))
    return <FileCode className="size-3.5 text-emerald-500" />
  return <FileText className="text-muted-foreground size-3.5" />
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

  const stats = useMemo(() => {
    if (!docsQuery.data) return { total: 0, ready: 0, processing: 0 }
    return {
      total: docsQuery.data.length,
      ready: docsQuery.data.filter((d) => d.status === "ready").length,
      processing: docsQuery.data.filter(
        (d) => d.status === "processing" || d.status === "pending"
      ).length,
    }
  }, [docsQuery.data])

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
      }, 150)

      uploadMutation.mutate(
        { botId: bot.id, file },
        {
          onSuccess: () => {
            clearInterval(interval)
            setUploadProgress(100)
            setTimeout(() => setUploadProgress(0), 400)
            toast.success("Document uploaded", {
              description: `"${file.name}" is queued for chunking and vector indexing.`,
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
          toast.success("Document removed", {
            description: `"${doc.filename}" and its vector embeddings have been deleted.`,
          })
        },
        onError: (err) => {
          toast.error("Delete failed", { description: err.message })
        },
      }
    )
  }

  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const url = urlInput.trim()
    if (!url) return
    submitUrlMutation.mutate(
      { botId: bot.id, url },
      {
        onSuccess: () => {
          toast.success("URL submitted", {
            description: `"${url}" will be crawled and indexed.`,
          })
          setUrlInput("")
        },
        onError: (err) => {
          toast.error("Failed to add URL", { description: err.message })
        },
      }
    )
  }

  return (
    <div className="space-y-5">
      {/* Unified Ingestion Container */}
      <div className="border-border/80 bg-card space-y-4 rounded-xl border p-4 shadow-xs">
        <div>
          <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
            Ingest Knowledge Sources
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Upload product manuals, markdown guides, spreadsheets, or crawl
            public documentation URLs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* File Drag & Drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-lg border border-dashed p-5 text-center transition-all ${
              dragOver
                ? "border-foreground bg-accent/40"
                : "border-border/90 hover:border-foreground/40 hover:bg-muted/30"
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
              className={`mx-auto mb-2 size-4.5 ${
                dragOver ? "text-foreground" : "text-muted-foreground"
              }`}
            />
            <p className="text-foreground text-xs font-medium">
              {dragOver ? "Drop to upload" : "Drop files or click to browse"}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {["PDF", "TXT", "MD", "CSV", "JSON"].map((ext) => (
                <span
                  key={ext}
                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* URL Scraper Input */}
          <div className="border-border/80 bg-muted/20 flex flex-col justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <span className="text-foreground flex items-center gap-1.5 text-xs font-medium">
                <Globe className="text-muted-foreground size-3.5" />
                Crawl Website Documentation
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Provide a public webpage URL. Botly will extract text and index
                vector embeddings.
              </p>
            </div>
            <form onSubmit={handleUrlSubmit} className="mt-3 flex gap-2">
              <Input
                placeholder="https://docs.yourcompany.com/overview"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-background h-8 flex-1 font-mono text-xs text-[12px]"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!urlInput.trim() || submitUrlMutation.isPending}
                className="shrink-0 gap-1.5"
              >
                {submitUrlMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <ExternalLink className="size-3" />
                )}
                <span>Add URL</span>
              </Button>
            </form>
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-muted-foreground flex items-center justify-between font-mono text-[11px]">
              <span>Uploading document...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}
      </div>

      {/* Documents Summary & Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
              Indexed Documents
            </h4>
            <Badge variant="outline" className="font-mono text-[11px]">
              {stats.total} total
            </Badge>
          </div>
          {stats.total > 0 && (
            <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="bg-status-ready size-1.5 rounded-full" />
                {stats.ready} ready
              </span>
              {stats.processing > 0 && (
                <span className="text-status-processing flex items-center gap-1">
                  <Loader2 className="size-2.5 animate-spin" />
                  {stats.processing} processing
                </span>
              )}
            </div>
          )}
        </div>

        {docsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : docsQuery.data && docsQuery.data.length > 0 ? (
          <div className="border-border/80 bg-card overflow-hidden rounded-xl border shadow-xs">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-muted-foreground text-[11px] font-semibold">
                    Document
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] font-semibold">
                    Chunks
                  </TableHead>
                  <TableHead className="text-muted-foreground text-[11px] font-semibold">
                    Source
                  </TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {docsQuery.data.map((doc, i) => {
                  const status =
                    STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending
                  const StatusIcon = status.icon

                  return (
                    <TableRow
                      key={doc.id}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {getDocumentIcon(doc.source_type, doc.filename)}
                          <span className="text-foreground max-w-sm truncate text-xs font-medium">
                            {doc.filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`gap-1 text-[10px] font-medium ${status.className}`}
                        >
                          <StatusIcon
                            className={`size-2.5 ${
                              doc.status === "processing" ||
                              doc.status === "pending"
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                          <span>{status.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground font-mono text-xs">
                          {doc.chunk_count !== undefined &&
                          doc.chunk_count !== null
                            ? doc.chunk_count
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-muted-foreground font-mono text-[10px]"
                        >
                          {doc.source_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {doc.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                reprocessMutation.mutate(
                                  { botId: bot.id, documentId: doc.id },
                                  {
                                    onSuccess: () =>
                                      toast.success("Reprocessing queued", {
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
                            title="Delete document"
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
          <div className="bg-card/40 rounded-xl border border-dashed py-12 text-center">
            <Database className="text-muted-foreground/40 mx-auto mb-2 size-5" />
            <p className="text-foreground text-xs font-semibold">
              No documents indexed yet
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Drag and drop files or add a URL above to build your bot's
              knowledge base.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
