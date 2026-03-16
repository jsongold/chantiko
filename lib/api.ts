import { createClient } from "@/lib/supabase"
import type { ApiResponse } from "@/types"

const API_BASE = "/api"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("Not authenticated")
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  let headers: HeadersInit
  try {
    headers = await getAuthHeaders()
  } catch {
    return { success: false, error: "Not authenticated" }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })

  if (response.status === 401) {
    return { success: false, error: "Not authenticated" }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Request failed",
    }))
    return { success: false, error: error.error || "Request failed" }
  }

  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patch: <T>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
}
