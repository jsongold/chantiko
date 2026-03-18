import { create } from "zustand"
import type { Operation } from "@/types"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  operations?: Operation[]
  status?: "applied" | "cancelled"
  created_at: string
  reply_to_id?: string
  reply_to_content?: string
  reply_to_role?: string
}

interface AIState {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  hasMore: boolean
  isLoadingMore: boolean
  replyTo: ChatMessage | null
}

interface AIActions {
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  prependMessages: (messages: ChatMessage[]) => void
  updateMessageStatus: (id: string, status: "applied" | "cancelled") => void
  setLoading: (loading: boolean) => void
  setSending: (sending: boolean) => void
  setHasMore: (hasMore: boolean) => void
  setLoadingMore: (isLoadingMore: boolean) => void
  setReplyTo: (message: ChatMessage | null) => void
  reset: () => void
}

const initialState: AIState = {
  messages: [],
  isLoading: false,
  isSending: false,
  hasMore: false,
  isLoadingMore: false,
  replyTo: null,
}

export const useAIStore = create<AIState & AIActions>()((set) => ({
  ...initialState,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  prependMessages: (messages) =>
    set((state) => ({ messages: [...messages, ...state.messages] })),
  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  setHasMore: (hasMore) => set({ hasMore }),
  setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setReplyTo: (replyTo) => set({ replyTo }),
  reset: () => set(initialState),
}))
