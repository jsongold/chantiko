import { create } from "zustand"
import { persist } from "zustand/middleware"
import { api } from "@/lib/api"

export type AIMode = "auto" | "ask" | "manual"

interface SettingsState {
  aiEnabled: boolean
  aiMode: AIMode
}

interface SettingsActions {
  setAIEnabled: (enabled: boolean) => void
  setAIMode: (mode: AIMode) => void
  syncFromServer: () => Promise<void>
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      aiEnabled: true,
      aiMode: "ask" as AIMode,

      setAIEnabled: (enabled) => {
        set({ aiEnabled: enabled })
        api.patch("/settings", { ai_enabled: enabled }).catch(() => {})
      },

      setAIMode: (mode) => {
        set({ aiMode: mode })
        api.patch("/settings", { ai_mode: mode }).catch(() => {})
      },

      syncFromServer: async () => {
        const res = await api.get<{ ai_mode: AIMode; ai_enabled: boolean }>("/settings")
        if (res.success && res.data) {
          set({
            aiMode: res.data.ai_mode,
            aiEnabled: res.data.ai_enabled,
          })
        }
      },
    }),
    {
      name: "chantiko-settings",
    }
  )
)
