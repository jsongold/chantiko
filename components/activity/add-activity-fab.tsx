"use client"

import { Plus, Bot } from "lucide-react"
import { Fab } from "@/components/shared/fab"
import { useSettingsStore } from "@/store/settingsStore"
import { features } from "@/lib/features"

interface AddActivityFabProps {
  onManualOpen: () => void
  onAIOpen: () => void
  manualLabel?: string
}

export function AddActivityFab({ onManualOpen, onAIOpen, manualLabel = "Add activity" }: AddActivityFabProps) {
  const aiMode = useSettingsStore((s) => s.aiMode)
  const isAIMode = features.aiChat && aiMode !== "manual"

  return (
    <Fab
      onClick={isAIMode ? onAIOpen : onManualOpen}
      icon={isAIMode ? Bot : Plus}
      label={isAIMode ? "Open AI chat" : manualLabel}
    />
  )
}
