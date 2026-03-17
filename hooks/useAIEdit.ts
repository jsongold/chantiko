"use client"

import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import type { AIEditResponse, Operation } from "@/types"

const APP_LLM_MODEL = "gpt-4.1-nano"

interface OperationHandlers {
  onCreate?: (data: Record<string, unknown>) => Promise<void>
  onUpdate?: (id: string, data: Record<string, unknown>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

interface AIEditState {
  isLoading: boolean
  preview: AIEditResponse | null
  error: string | null
}

export function useAIEdit() {
  const [state, setState] = useState<AIEditState>({
    isLoading: false,
    preview: null,
    error: null,
  })

  const submitCommand = useCallback(
    async (
      command: string,
      context: Record<string, unknown>,
      endpoint: "activity_edit" | "goal_edit"
    ) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))

      try {
        const response = await api.post<AIEditResponse>(`/ai/${endpoint}`, {
          command,
          context,
          model: APP_LLM_MODEL,
        })

        if (!response.success || !response.data) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: response.error ?? "AI command failed",
          }))
          return null
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          preview: response.data ?? null,
        }))

        return response.data
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "AI command failed"
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
        return null
      }
    },
    []
  )

  const applyOperations = useCallback(
    async (operations: Operation[], handlers: OperationHandlers) => {
      for (const operation of operations) {
        switch (operation.op) {
          case "create":
            if (handlers.onCreate && operation.data) {
              await handlers.onCreate(operation.data)
            }
            break
          case "update":
            if (handlers.onUpdate && operation.id && operation.data) {
              await handlers.onUpdate(operation.id, operation.data)
            }
            break
          case "delete":
            if (handlers.onDelete && operation.id) {
              await handlers.onDelete(operation.id)
            }
            break
        }
      }
    },
    []
  )

  const clearPreview = useCallback(() => {
    setState({
      isLoading: false,
      preview: null,
      error: null,
    })
  }, [])

  return {
    isLoading: state.isLoading,
    preview: state.preview,
    error: state.error,
    submitCommand,
    applyOperations,
    clearPreview,
  }
}
