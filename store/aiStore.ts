import { create } from "zustand"
import type { Operation } from "@/types"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  operations?: Operation[]
  status?: "applied" | "cancelled"
  created_at: string
}

interface AIState {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
}

interface AIActions {
  setMessages: (messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessageStatus: (id: string, status: "applied" | "cancelled") => void
  setLoading: (loading: boolean) => void
  setSending: (sending: boolean) => void
  reset: () => void
}

const initialState: AIState = {
  messages: [],
  isLoading: false,
  isSending: false,
}

export const useAIStore = create<AIState & AIActions>()((set) => ({
  ...initialState,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, status } : m
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),
  reset: () => set(initialState),
}))
