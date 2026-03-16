"use client"

import { useCallback, useState } from "react"
import { useAIEdit } from "@/hooks/useAIEdit"
import { useSettingsStore } from "@/store/settingsStore"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"

interface OperationHandlers {
  onCreate?: (data: Record<string, unknown>) => Promise<void>
  onUpdate?: (id: string, data: Record<string, unknown>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

interface AIEditSectionProps {
  contextProvider: () => Record<string, unknown>
  endpoint: "activity_edit" | "goal_edit"
  handlers: OperationHandlers
  placeholder?: string
}

export function AIEditSection({
  contextProvider,
  endpoint,
  handlers,
  placeholder,
}: AIEditSectionProps) {
  const { aiEnabled } = useSettingsStore()
  const {
    isLoading: isAILoading,
    preview,
    submitCommand,
    applyOperations,
    clearPreview,
  } = useAIEdit()
  const [isApplying, setIsApplying] = useState(false)

  const handleAICommand = useCallback(
    (command: string) => {
      submitCommand(command, contextProvider(), endpoint)
    },
    [submitCommand, contextProvider, endpoint]
  )

  const handleApplyAI = useCallback(async () => {
    if (!preview) {
      return
    }

    setIsApplying(true)
    try {
      await applyOperations(preview.operations, handlers)
      clearPreview()
    } finally {
      setIsApplying(false)
    }
  }, [preview, applyOperations, handlers, clearPreview])

  if (!aiEnabled) {
    return null
  }

  return (
    <>
      <AIEditBar
        onSubmit={handleAICommand}
        isLoading={isAILoading}
        placeholder={placeholder}
      />
      <AIPreviewModal
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearPreview()
          }
        }}
        preview={preview}
        onApply={handleApplyAI}
        isApplying={isApplying}
      />
    </>
  )
}
