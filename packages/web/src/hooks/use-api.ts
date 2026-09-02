import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@clerk/react"
import type {
  Bot,
  Document,
  Conversation,
  Message,
  CreateBotInput,
  WidgetConfig,
} from "types"

const baseUrl = import.meta.env.VITE_API_URL || ""



// ─── Helper to get auth headers ─────────────────────────────────────

function useAuthHeaders() {
  const { getToken } = useAuth()
  return async (): Promise<Record<string, string>> => {
    const token = await getToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    return headers
  }
}

// ─── Bot Hooks ──────────────────────────────────────────────────────

export function useBotsQuery(orgId?: string | null) {
  const getHeaders = useAuthHeaders()

  return useQuery<Bot[], Error>({
    queryKey: ["bots", orgId],
    queryFn: async () => {
      if (!orgId) return []
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots?org_id=${orgId}`, {
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to fetch bots (HTTP ${res.status})`)
      }
      return res.json()
    },
    enabled: !!orgId,
  })
}

export function useBotQuery(botId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<Bot, Error>({
    queryKey: ["bots", botId],
    queryFn: async () => {
      if (!botId) throw new Error("No bot ID provided")
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to fetch bot ${botId} (HTTP ${res.status})`)
      }
      return res.json()
    },
    enabled: !!botId,
  })
}

export function useCreateBotMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<Bot, Error, CreateBotInput>({
    mutationFn: async (input) => {
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to create bot (HTTP ${res.status})`)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bots"] })
    },
  })
}

export function useUpdateBotMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<Bot, Error, { id: string; data: Partial<Bot> }>({
    mutationFn: async ({ id, data }) => {
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to update bot (HTTP ${res.status})`)
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bots"] })
      queryClient.invalidateQueries({ queryKey: ["bots", variables.id] })
    },
  })
}

export function useDeleteBotMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to delete bot (HTTP ${res.status})`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bots"] })
    },
  })
}

// ─── Document Hooks ─────────────────────────────────────────────────

export function useDocumentsQuery(botId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<Document[], Error>({
    queryKey: ["documents", botId],
    queryFn: async () => {
      if (!botId) return []
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}/documents`, {
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to fetch documents for bot ${botId}`)
      }
      return res.json()
    },
    enabled: !!botId,
  })
}

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<Document, Error, { botId: string; file: File }>({
    mutationFn: async ({ botId, file }) => {
      const headers = await getHeaders()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${baseUrl}/api/bots/${botId}/documents`, {
        method: "POST",
        headers,
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to upload document: ${file.name}`)
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.botId],
      })
    },
  })
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<void, Error, { botId: string; documentId: string }>({
    mutationFn: async ({ botId, documentId }) => {
      const headers = await getHeaders()
      const res = await fetch(
        `${baseUrl}/api/bots/${botId}/documents/${documentId}`,
        {
          method: "DELETE",
          headers,
        }
      )
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to delete document")
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.botId],
      })
    },
  })
}

export function useEmbedSnippetQuery(botId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<
    { botId: string; snippet: string; scriptUrl: string },
    Error
  >({
    queryKey: ["bots", botId, "embed-snippet"],
    queryFn: async () => {
      if (!botId) throw new Error("No bot ID provided")
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}/embed-snippet`, {
        headers,
      })
      if (!res.ok) {
        const host = window.location.origin
        return {
          botId,
          snippet: `<script\n  src="${host}/widget.js"\n  data-bot-id="${botId}"\n  async\n></script>`,
          scriptUrl: `${host}/widget.js`,
        }
      }
      return res.json()
    },
    enabled: !!botId,
  })
}

export function useReprocessDocumentMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<Document, Error, { botId: string; documentId: string }>({
    mutationFn: async ({ documentId }) => {
      const headers = await getHeaders()
      const res = await fetch(
        `${baseUrl}/api/documents/${documentId}/reprocess`,
        {
          method: "POST",
          headers,
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to reprocess document")
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", variables.botId],
      })
    },
  })
}

// ─── Conversation Hooks ─────────────────────────────────────────────

export function useConversationsQuery(botId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<Conversation[], Error>({
    queryKey: ["conversations", botId],
    queryFn: async () => {
      if (!botId) return []
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}/conversations`, {
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to fetch conversations for bot ${botId}`)
      }
      return res.json()
    },
    enabled: !!botId,
  })
}

export function useMessagesQuery(conversationId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<Message[], Error>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const headers = await getHeaders()
      const res = await fetch(
        `${baseUrl}/api/conversations/${conversationId}/messages`,
        { headers }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to fetch messages for conversation ${conversationId}`)
      }
      return res.json()
    },
    enabled: !!conversationId,
  })
}

// ─── Widget Config Hooks ────────────────────────────────────────────

export function useUpdateWidgetConfigMutation() {
  const queryClient = useQueryClient()
  const getHeaders = useAuthHeaders()

  return useMutation<
    Bot,
    Error,
    { botId: string; widget_config: WidgetConfig }
  >({
    mutationFn: async ({ botId, widget_config }) => {
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ widget_config }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to update widget config (HTTP ${res.status})`)
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bots"] })
      queryClient.invalidateQueries({ queryKey: ["bots", variables.botId] })
    },
  })
}

// ─── Legacy queries for home/organization pages ──────────────────────

export function useHealthQuery() {
  return useQuery({
    queryKey: ["api", "health"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/health`)
      return res.json()
    },
  })
}

export function useMessageQuery() {
  return useQuery({
    queryKey: ["api", "message"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/message`)
      return res.json()
    },
  })
}

export function useOrganizationApiQuery() {
  const { getToken, isSignedIn, orgId } = useAuth()
  return useQuery({
    queryKey: ["api", "organization", orgId ?? "none"],
    queryFn: async () => {
      const token = await getToken()
      const headers: Record<string, string> = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      const res = await fetch(`${baseUrl}/api/organization`, { headers })
      return res.json()
    },
    enabled: Boolean(isSignedIn),
  })
}
