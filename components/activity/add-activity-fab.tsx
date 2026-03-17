"use client"

import { Plus, Bot, Zap, Pencil } from "lucide-react"
import { Fab } from "@/components/shared/fab"
import { Button } from "@/components/ui/button"
import { useSettingsStore, type AIMode } from "@/store/settingsStore"
import { features } from "@/lib/features"

interface AddActivityFabProps {
  onManualOpen: () => void
  onAIOpen: () => void
  manualLabel?: string
}

const MODE_CYCLE: AIMode[] = ["manual", "ask", "auto"]

const MODE_ICONS: Record<AIMode, React.ElementType> = {
  manual: Pencil,
  ask: Bot,
  auto: Zap,
}

export function AddActivityFab({ onManualOpen, onAIOpen, manualLabel = "Add activity" }: AddActivityFabProps) {
  const aiMode = useSettingsStore((s) => s.aiMode)
  const setAIMode = useSettingsStore((s) => s.setAIMode)
  const isAIMode = features.aiChat && aiMode !== "manual"

  const ModeIcon = MODE_ICONS[aiMode]

  const cycleMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(aiMode) + 1) % MODE_CYCLE.length]
    setAIMode(next)
  }

  return (
    <>
      <Fab
        onClick={isAIMode ? onAIOpen : onManualOpen}
        icon={isAIMode ? Bot : Plus}
        label={isAIMode ? "Open AI chat" : manualLabel}
      />
      {features.aiChat && (
        <Button
          variant="outline"
          size="icon"
          onClick={cycleMode}
          aria-label={`AI mode: ${aiMode}`}
          className="fixed bottom-[5.5rem] left-1/2 translate-x-5 z-40 size-7 rounded-full shadow-md p-0 bg-background"
        >
          <ModeIcon className="size-3.5" />
        </Button>
      )}
    </>
  )
}
