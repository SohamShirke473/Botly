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

// ─── Mock Data ──────────────────────────────────────────────────────

const MOCK_BOTS: Bot[] = [
  {
    id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    org_id: "org_1",
    name: "Support Bot",
    system_prompt:
      "You are a helpful support assistant. Answer questions based on the uploaded documentation.",
    widget_config: {
      theme: {
        primaryColor: "#171717",
        position: "bottom-right",
        bubbleIcon: "chat",
      },
      greeting: "Hi! How can I help you today?",
      placeholder: "Ask a question...",
      showBranding: true,
    },
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    org_id: "org_1",
    name: "Product Docs",
    system_prompt: "You are a product documentation assistant.",
    widget_config: {
      theme: {
        primaryColor: "#10b981",
        position: "bottom-left",
        bubbleIcon: "sparkle",
      },
      greeting: "Welcome! Ask me about our features.",
      placeholder: "Search the docs...",
      showBranding: false,
    },
    created_at: "2026-08-20T14:30:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
    org_id: "org_1",
    name: "Onboarding Guide",
    system_prompt: "You help new users get started with the platform.",
    widget_config: null,
    created_at: "2026-08-28T09:15:00Z",
  },
]

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "d1",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    filename: "getting-started.pdf",
    source_type: "pdf",
    status: "ready",
    chunk_count: 24,
    created_at: "2026-08-15T10:05:00Z",
  },
  {
    id: "d2",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    filename: "api-reference.md",
    source_type: "text",
    status: "ready",
    chunk_count: 42,
    created_at: "2026-08-15T10:10:00Z",
  },
  {
    id: "d3",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    filename: "pricing.html",
    source_type: "url",
    status: "processing",
    chunk_count: 0,
    created_at: "2026-08-16T08:00:00Z",
  },
  {
    id: "d4",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    filename: "faq.txt",
    source_type: "text",
    status: "pending",
    chunk_count: 0,
    created_at: "2026-08-17T12:00:00Z",
  },
  {
    id: "d5",
    bot_id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    filename: "product-guide.pdf",
    source_type: "pdf",
    status: "ready",
    chunk_count: 31,
    created_at: "2026-08-20T14:35:00Z",
  },
  {
    id: "d6",
    bot_id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    filename: "changelog.md",
    source_type: "text",
    status: "failed",
    chunk_count: 0,
    created_at: "2026-08-21T09:00:00Z",
  },
]

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    visitor_id: "visitor_abc123",
    created_at: "2026-08-29T14:20:00Z",
    last_message: "How do I reset my password?",
    message_count: 4,
  },
  {
    id: "conv2",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    visitor_id: "visitor_def456",
    created_at: "2026-08-29T15:05:00Z",
    last_message: "What plans do you offer?",
    message_count: 6,
  },
  {
    id: "conv3",
    bot_id: "b1e8c7d2-4a3f-4b5e-9c1d-2e3f4a5b6c7d",
    visitor_id: "visitor_ghi789",
    created_at: "2026-08-30T09:30:00Z",
    last_message: "Can I export my data?",
    message_count: 2,
  },
  {
    id: "conv4",
    bot_id: "a2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d",
    visitor_id: "visitor_jkl012",
    created_at: "2026-08-30T11:00:00Z",
    last_message: "Tell me about the new features.",
    message_count: 8,
  },
]

const MOCK_MESSAGES: Message[] = [
  {
    id: "m1",
    conversation_id: "conv1",
    role: "user",
    content: "How do I reset my password?",
    created_at: "2026-08-29T14:20:00Z",
  },
  {
    id: "m2",
    conversation_id: "conv1",
    role: "assistant",
    content:
      "To reset your password, go to Settings > Security > Change Password. You'll receive a verification email to confirm the change.",
    created_at: "2026-08-29T14:20:05Z",
  },
  {
    id: "m3",
    conversation_id: "conv1",
    role: "user",
    content: "I didn't receive the email.",
    created_at: "2026-08-29T14:21:00Z",
  },
  {
    id: "m4",
    conversation_id: "conv1",
    role: "assistant",
    content:
      "Check your spam folder. If it's not there, you can request a new verification email from the same Settings page. Make sure you're using the email address associated with your account.",
    created_at: "2026-08-29T14:21:10Z",
  },
  {
    id: "m5",
    conversation_id: "conv2",
    role: "user",
    content: "What plans do you offer?",
    created_at: "2026-08-29T15:05:00Z",
  },
  {
    id: "m6",
    conversation_id: "conv2",
    role: "assistant",
    content:
      "We offer three plans:\n\n**Starter** — $29/mo: 1 chatbot, 1,000 messages/mo, 50MB knowledge base\n**Pro** — $79/mo: 5 chatbots, 10,000 messages/mo, 500MB knowledge base\n**Enterprise** — Custom: Unlimited chatbots, dedicated support, custom integrations",
    created_at: "2026-08-29T15:05:08Z",
  },
  {
    id: "m7",
    conversation_id: "conv2",
    role: "user",
    content: "Can I upgrade later?",
    created_at: "2026-08-29T15:06:00Z",
  },
  {
    id: "m8",
    conversation_id: "conv2",
    role: "assistant",
    content:
      "Yes, you can upgrade or downgrade at any time from your billing settings. Changes take effect immediately, and we'll prorate the difference.",
    created_at: "2026-08-29T15:06:05Z",
  },
]

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
      if (!orgId) return MOCK_BOTS
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots?org_id=${orgId}`, {
        headers,
      })
      if (!res.ok) return MOCK_BOTS
      return res.json()
    },
    enabled: true,
  })
}

export function useBotQuery(botId: string | undefined) {
  const getHeaders = useAuthHeaders()

  return useQuery<Bot, Error>({
    queryKey: ["bots", botId],
    queryFn: async () => {
      if (!botId) throw new Error("No bot ID")
      const headers = await getHeaders()
      const res = await fetch(`${baseUrl}/api/bots/${botId}`, { headers })
      if (!res.ok) {
        return MOCK_BOTS.find((b) => b.id === botId) || MOCK_BOTS[0]
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
        // Mock creation
        const newBot: Bot = {
          id: crypto.randomUUID(),
          org_id: "org_1",
          name: input.name,
          system_prompt: input.system_prompt || null,
          widget_config: null,
          created_at: new Date().toISOString(),
        }
        return newBot
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
        const existing = MOCK_BOTS.find((b) => b.id === id) || MOCK_BOTS[0]
        return { ...existing, ...data }
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
        // Mock deletion
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
        return MOCK_DOCUMENTS.filter((d) => d.bot_id === botId)
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
        const newDoc: Document = {
          id: crypto.randomUUID(),
          bot_id: botId,
          filename: file.name,
          source_type: file.name.endsWith(".pdf") ? "pdf" : "text",
          status: "pending",
          chunk_count: 0,
          created_at: new Date().toISOString(),
        }
        return newDoc
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
        // Mock deletion
      }
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
        return MOCK_CONVERSATIONS.filter((c) => c.bot_id === botId)
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
        return MOCK_MESSAGES.filter((m) => m.conversation_id === conversationId)
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
        const existing = MOCK_BOTS.find((b) => b.id === botId) || MOCK_BOTS[0]
        return { ...existing, widget_config }
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
