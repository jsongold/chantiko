"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Bot, Zap, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettingsStore, type AIMode } from "@/store/settingsStore"
import { features } from "@/lib/features"
import { cn } from "@/lib/utils"

interface AddActivityFabProps {
  onManualOpen: () => void
  onAIOpen: () => void
  manualLabel?: string
}

const MODES: { mode: AIMode; icon: React.ElementType; label: string }[] = [
  { mode: "manual", icon: Pencil, label: "Manual" },
  { mode: "ask", icon: Bot, label: "Ask AI" },
  { mode: "auto", icon: Zap, label: "Auto AI" },
]

const FAB_ICONS: Record<AIMode, React.ElementType> = {
  manual: Plus,
  ask: Bot,
  auto: Zap,
}

const LONG_PRESS_MS = 600

export function AddActivityFab({ onManualOpen, onAIOpen, manualLabel = "Add activity" }: AddActivityFabProps) {
  const aiMode = useSettingsStore((s) => s.aiMode)
  const setAIMode = useSettingsStore((s) => s.setAIMode)
  const isAIMode = features.aiChat && aiMode !== "manual"

  const [radialOpen, setRadialOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPressRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handlePressStart = useCallback(() => {
    if (!features.aiChat) return
    didLongPressRef.current = false
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true
      setRadialOpen(true)
    }, LONG_PRESS_MS)
  }, [])

  const handlePressEnd = useCallback(() => {
    clearTimer()
    if (didLongPressRef.current) return
    // Short tap — trigger normal action
    if (isAIMode) {
      onAIOpen()
    } else {
      onManualOpen()
    }
  }, [clearTimer, isAIMode, onAIOpen, onManualOpen])

  const handleSelectMode = useCallback(
    (mode: AIMode) => {
      setAIMode(mode)
      setRadialOpen(false)
    },
    [setAIMode]
  )

  // Close radial on outside tap
  useEffect(() => {
    if (!radialOpen) return
    const close = () => setRadialOpen(false)
    const timer = setTimeout(() => document.addEventListener("pointerdown", close), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("pointerdown", close)
    }
  }, [radialOpen])

  const FabIcon = FAB_ICONS[aiMode]

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      {/* Radial mode options */}
      {radialOpen && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex gap-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {MODES.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={mode === aiMode ? "default" : "outline"}
              size="icon"
              className="size-10 rounded-full shadow-md animate-in fade-in zoom-in-50 duration-150"
              aria-label={label}
              onClick={() => handleSelectMode(mode)}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon-lg"
        className="rounded-full size-12 shadow-md"
        aria-label={isAIMode ? "Open AI chat" : manualLabel}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <FabIcon className="size-5" />
      </Button>
    </div>
  )
}
