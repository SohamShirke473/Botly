import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@clerk/react"
import type { HealthCheckResponse, MessageResponse } from "types"

const baseUrl = import.meta.env.VITE_API_URL || ""

export interface ProtectedApiResponse {
  message: string
  userId: string
  user: {
    id: string
    firstName?: string | null
    lastName?: string | null
    emailAddresses?: Array<{ emailAddress: string }>
    imageUrl?: string
  }
}

// 1. Health check query
export function useHealthQuery(options?: { enabled?: boolean }) {
  return useQuery<HealthCheckResponse, Error>({
    queryKey: ["api", "health"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/health`)
      if (!res.ok) {
        throw new Error(`Health check failed with status: ${res.status}`)
      }
      return res.json()
    },
    enabled: options?.enabled ?? true,
  })
}

// 2. Greeting message query
export function useMessageQuery() {
  return useQuery<MessageResponse, Error>({
    queryKey: ["api", "message"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/message`)
      if (!res.ok) {
        throw new Error(`Message fetch failed with status: ${res.status}`)
      }
      return res.json()
    },
  })
}

// 3. Protected endpoint query with Clerk Bearer token
export function useProtectedUserQuery() {
  const { getToken, isSignedIn } = useAuth()

  return useQuery<ProtectedApiResponse, Error>({
    queryKey: ["api", "protected-user"],
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error("No active Clerk session token found")
      }

      const res = await fetch(`${baseUrl}/api/protected`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
            `Protected request failed with status ${res.status}`
        )
      }

      return res.json()
    },
    enabled: Boolean(isSignedIn),
  })
}

export interface OrganizationApiResponse {
  hasActiveOrg: boolean
  message: string
  userId: string
  orgId: string | null
  orgRole: string | null
  orgSlug: string | null
  orgPermissions?: string[]
  organization?: {
    id: string
    name: string
    slug: string
    imageUrl?: string
    membersCount?: number
  }
}

// 4. Organization endpoint query with Clerk Bearer token
export function useOrganizationApiQuery() {
  const { getToken, isSignedIn, orgId } = useAuth()

  return useQuery<OrganizationApiResponse, Error>({
    queryKey: ["api", "organization", orgId ?? "none"],
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error("No active Clerk session token found")
      }

      const res = await fetch(`${baseUrl}/api/organization`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
            `Organization request failed with status ${res.status}`
        )
      }

      return res.json()
    },
    enabled: Boolean(isSignedIn),
  })
}
