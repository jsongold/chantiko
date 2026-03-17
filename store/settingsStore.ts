import { create } from "zustand"
import { persist } from "zustand/middleware"

export const LLM_MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { value: "claude-sonnet-4-5-20250514", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
] as const

export type LLMModel = (typeof LLM_MODELS)[number]["value"]

export type AIMode = "auto" | "ask" | "manual"

interface SettingsState {
  aiEnabled: boolean
  llmModel: LLMModel
  aiMode: AIMode
}

interface SettingsActions {
  setAIEnabled: (enabled: boolean) => void
  setLLMModel: (model: LLMModel) => void
  setAIMode: (mode: AIMode) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      aiEnabled: true,
      llmModel: "gpt-4o-mini",
      aiMode: "ask" as AIMode,

      setAIEnabled: (enabled) => set({ aiEnabled: enabled }),
      setLLMModel: (model) => set({ llmModel: model }),
      setAIMode: (mode) => set({ aiMode: mode }),
    }),
    {
      name: "chantiko-settings",
    }
  )
)
