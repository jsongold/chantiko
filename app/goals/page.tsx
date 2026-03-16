"use client"

import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GoalTree } from "@/components/goals/goal-tree"
import {
  AddLayerSheet,
  type AddLayerFormValues,
} from "@/components/goals/add-layer-sheet"
import { useLayers } from "@/hooks/useLayers"
import { useAIEdit } from "@/hooks/useAIEdit"
import { useSettingsStore } from "@/store/settingsStore"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import type { Layer } from "@/types"

export default function GoalsPage() {
  const { layers, isLoading, fetchLayers, createLayer, updateLayer, deleteLayer } =
    useLayers()
  const {
    isLoading: isAILoading,
    preview,
    submitCommand,
    applyOperations,
    clearPreview,
  } = useAIEdit()
  const { aiEnabled } = useSettingsStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    fetchLayers()
  }, [fetchLayers])

  const handleToggleTask = useCallback(
    async (id: string, done: boolean) => {
      const newStatus: Layer["status"] = done ? "done" : "active"
      await updateLayer(id, { status: newStatus })
    },
    [updateLayer]
  )

  const handleAddLayer = useCallback(
    async (data: AddLayerFormValues) => {
      await createLayer({
        type: data.type,
        name: data.name,
        description: data.description,
        parent: data.parent,
        target_value: data.target_value,
        current_value: null,
        status: "active",
      })
    },
    [createLayer]
  )

  const handleAICommand = useCallback(
    (command: string) => {
      submitCommand(command, { layers }, "goal_edit")
    },
    [submitCommand, layers]
  )

  const handleApplyAI = useCallback(async () => {
    if (!preview) {
      return
    }

    setIsApplying(true)
    try {
      await applyOperations(preview.operations, {
        onCreate: async (opData) => {
          await createLayer(opData as Omit<Layer, "id" | "user_id" | "is_deleted" | "created_at" | "updated_at">)
        },
        onUpdate: async (id, opData) => {
          await updateLayer(id, opData as Partial<Layer>)
        },
        onDelete: async (id) => {
          await deleteLayer(id)
        },
      })
      clearPreview()
    } finally {
      setIsApplying(false)
    }
  }, [preview, applyOperations, createLayer, updateLayer, deleteLayer, clearPreview])

  return (
    <AppShell>
      {aiEnabled && <AIEditBar onSubmit={handleAICommand} isLoading={isAILoading} placeholder="Ask AI to edit goals..." />}

      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">Goals</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Track your goals and tasks.
        </p>

        {isLoading && layers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : (
          <GoalTree
            layers={layers}
            onToggleTask={handleToggleTask}
            onDelete={deleteLayer}
          />
        )}
      </div>

      <Button
        size="icon"
        className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-lg"
        onClick={() => setSheetOpen(true)}
        aria-label="Add goal or task"
      >
        <PlusIcon className="size-5" />
      </Button>

      <AddLayerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleAddLayer}
        existingLayers={layers}
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
    </AppShell>
  )
}
