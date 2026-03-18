"use client"

import { useCallback, useRef, useState } from "react"
import { Plus, Bot, Zap, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSettingsStore, type AIMode } from "@/store/settingsStore"
import { features } from "@/lib/features"

interface ChikoFabProps {
  onManualOpen: () => void
  onAIOpen: () => void
  manualLabel?: string
}

// Radial positions: 135° (top-left), 90° (top), 45° (top-right) at r=70px
const MODES: { mode: AIMode; icon: React.ElementType; label: string; x: number; y: number }[] = [
  { mode: "manual", icon: Pencil, label: "Manual", x: -50, y: -50 },
  { mode: "ask", icon: Bot, label: "Ask AI", x: 0, y: -70 },
  { mode: "auto", icon: Zap, label: "Auto AI", x: 50, y: -50 },
]

const FAB_ICONS: Record<AIMode, React.ElementType> = {
  manual: Plus,
  ask: Bot,
  auto: Zap,
}

const LONG_PRESS_MS = 600

export function ChikoFab({ onManualOpen, onAIOpen, manualLabel = "Add activity" }: ChikoFabProps) {
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

  const FabIcon = FAB_ICONS[aiMode]

  return (
    <>
      {/* Backdrop — closes radial on tap */}
      {radialOpen && (
        <div
          className="fixed inset-0 z-30"
          onTouchEnd={() => setRadialOpen(false)}
          onClick={() => setRadialOpen(false)}
        />
      )}

      {/* Radial mode options — arc at 135°, 90°, 45° */}
      {radialOpen &&
        MODES.map(({ mode, icon: Icon, label, x, y }) => (
          <Button
            key={mode}
            variant={mode === aiMode ? "default" : "outline"}
            size="icon"
            className="fixed z-40 size-10 rounded-full shadow-md animate-in fade-in zoom-in-50 duration-150"
            style={{
              bottom: `calc(5rem + 1.5rem - ${y}px)`,
              left: `calc(50% + ${x}px)`,
              transform: "translate(-50%, 50%)",
            }}
            aria-label={label}
            onTouchEnd={(e) => {
              e.stopPropagation()
              handleSelectMode(mode)
            }}
            onClick={(e) => {
              e.stopPropagation()
              handleSelectMode(mode)
            }}
          >
            <Icon className="size-4" />
          </Button>
        ))}

      {/* Main FAB */}
      <Button
        size="icon-lg"
        className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full size-12 shadow-md"
        aria-label={isAIMode ? "Open AI chat" : manualLabel}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        <FabIcon className="size-5" />
      </Button>
    </>
  )
}
