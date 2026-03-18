"use client"

import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import { useSettingsStore } from "@/store/settingsStore"
import { useAIStore, type ChatMessage } from "@/store/aiStore"
import type { AIEditResponse, Operation } from "@/types"

const APP_LLM_MODEL = "gpt-4.1-nano"

interface OperationHandlers {
  onCreate?: (entity: string, data: Record<string, unknown>) => Promise<void>
  onUpdate?: (entity: string, id: string, data: Record<string, unknown>) => Promise<void>
  onDelete?: (entity: string, id: string) => Promise<void>
}

interface ChatOperation extends Operation {
  entity?: string
}

interface ChatResponse {
  user_message_id: string
  assistant_message_id: string
  operations: ChatOperation[]
  summary: string
}

interface SessionsResponse {
  messages: ChatMessage[]
  has_more: boolean
}

export function useAIChat(handlers: OperationHandlers) {
  const aiMode = useSettingsStore((s) => s.aiMode)
  const {
    setMessages,
    addMessage,
    prependMessages,
    updateMessageStatus,
    setLoading,
    setSending,
    setHasMore,
    setLoadingMore,
    setReplyTo,
  } = useAIStore()

  const [pendingPreview, setPendingPreview] = useState<{
    assistantMessageId: string
    preview: AIEditResponse
  } | null>(null)

  const applyOperations = useCallback(
    async (operations: ChatOperation[]) => {
      for (const operation of operations) {
        const entity = operation.entity ?? "activity"
        switch (operation.op) {
          case "create":
            if (handlers.onCreate && operation.data) {
              await handlers.onCreate(entity, operation.data)
            }
            break
          case "update":
            if (handlers.onUpdate && operation.id && operation.data) {
              await handlers.onUpdate(entity, operation.id, operation.data)
            }
            break
          case "delete":
            if (handlers.onDelete && operation.id) {
              await handlers.onDelete(entity, operation.id)
            }
            break
        }
      }
    },
    [handlers]
  )

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<SessionsResponse>("/ai/sessions?limit=10")
      if (res.success && res.data) {
        setMessages(res.data.messages)
        setHasMore(res.data.has_more)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, setMessages, setHasMore])

  const fetchOlderMessages = useCallback(async () => {
    const messages = useAIStore.getState().messages
    if (messages.length === 0) return

    setLoadingMore(true)
    try {
      const before = messages[0].created_at
      const res = await api.get<SessionsResponse>(
        `/ai/sessions?limit=10&before=${encodeURIComponent(before)}`
      )
      if (res.success && res.data) {
        prependMessages(res.data.messages)
        setHasMore(res.data.has_more)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [prependMessages, setHasMore, setLoadingMore])

  const sendCommand = useCallback(
    async (command: string, context: Record<string, unknown>, replyToId?: string) => {
      const enrichedContext = { today: new Date().toISOString().slice(0, 10), ...context }
      const messages = useAIStore.getState().messages
      const replyTo = useAIStore.getState().replyTo
      const effectiveReplyToId = replyToId ?? replyTo?.id
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const optimisticUserMsg: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        role: "user",
        content: command,
        created_at: new Date().toISOString(),
        reply_to_id: effectiveReplyToId,
        reply_to_content: replyTo?.content,
        reply_to_role: replyTo?.role,
      }
      addMessage(optimisticUserMsg)
      setSending(true)
      setReplyTo(null)

      try {
        const res = await api.post<ChatResponse>("/ai/chat", {
          command,
          history,
          context: enrichedContext,
          model: APP_LLM_MODEL,
          reply_to_id: effectiveReplyToId ?? null,
        })

        if (!res.success || !res.data) {
          const errorMsg: ChatMessage = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: res.error ?? "Something went wrong. Please try again.",
            created_at: new Date().toISOString(),
          }
          addMessage(errorMsg)
          return
        }

        const { user_message_id, assistant_message_id, operations, summary } =
          res.data

        const currentMessages = useAIStore.getState().messages
        const updatedMessages = currentMessages.map((m) =>
          m.id === optimisticUserMsg.id
            ? { ...m, id: user_message_id }
            : m
        )
        setMessages(updatedMessages)

        const assistantMsg: ChatMessage = {
          id: assistant_message_id,
          role: "assistant",
          content: summary,
          operations,
          created_at: new Date().toISOString(),
        }
        addMessage(assistantMsg)

        if (aiMode === "auto") {
          await applyOperations(operations)
          updateMessageStatus(assistant_message_id, "applied")
        } else if (aiMode === "ask" && operations.length > 0) {
          setPendingPreview({
            assistantMessageId: assistant_message_id,
            preview: { operations, summary },
          })
        }
      } finally {
        setSending(false)
      }
    },
    [aiMode, addMessage, setSending, setMessages, setReplyTo, applyOperations, updateMessageStatus]
  )

  const applyPending = useCallback(async () => {
    if (!pendingPreview) return
    await applyOperations(pendingPreview.preview.operations as ChatOperation[])
    updateMessageStatus(pendingPreview.assistantMessageId, "applied")
    setPendingPreview(null)
  }, [pendingPreview, applyOperations, updateMessageStatus])

  const cancelPending = useCallback(() => {
    if (!pendingPreview) return
    updateMessageStatus(pendingPreview.assistantMessageId, "cancelled")
    setPendingPreview(null)
  }, [pendingPreview, updateMessageStatus])

  return {
    fetchHistory,
    fetchOlderMessages,
    sendCommand,
    applyPending,
    cancelPending,
    pendingPreview,
  }
}
