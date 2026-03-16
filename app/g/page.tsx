"use client"

import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { GoalList } from "@/components/goals/goal-list"
import {
  AddGoalSheet,
  type GoalFormValues,
} from "@/components/goals/add-goal-sheet"
import { useGoals } from "@/hooks/useGoals"
import { useAIEdit } from "@/hooks/useAIEdit"
import { useSettingsStore } from "@/store/settingsStore"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"
import { RouteButton } from "@/components/shared/route-button"
import type { GoalWithCounts } from "@/types"

export default function GoalsPage() {
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } =
    useGoals()
  const {
    isLoading: isAILoading,
    preview,
    submitCommand,
    applyOperations,
    clearPreview,
  } = useAIEdit()
  const { aiEnabled } = useSettingsStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithCounts | null>(null)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleAddGoal = useCallback(
    async (data: GoalFormValues) => {
      await createGoal({
        name: data.name,
        description: data.description,
        target_value: data.target_value,
        due_date: data.due_date ?? null,
      })
    },
    [createGoal]
  )

  const handleUpdateGoal = useCallback(
    async (data: GoalFormValues) => {
      if (!editingGoal) {
        return
      }
      await updateGoal(editingGoal.id, {
        name: data.name,
        description: data.description,
        target_value: data.target_value,
        due_date: data.due_date ?? null,
      })
      setEditingGoal(null)
    },
    [editingGoal, updateGoal]
  )

  const handleEditGoal = useCallback((goal: GoalWithCounts) => {
    setEditingGoal(goal)
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingGoal(null)
    }
  }, [])

  const handleAICommand = useCallback(
    (command: string) => {
      submitCommand(command, { goals }, "goal_edit")
    },
    [submitCommand, goals]
  )

  const handleApplyAI = useCallback(async () => {
    if (!preview) {
      return
    }

    setIsApplying(true)
    try {
      await applyOperations(preview.operations, {
        onCreate: async (opData) => {
          const entity = opData.entity as string
          if (entity === "goal") {
            await createGoal(opData as { name: string; description?: string })
          }
        },
        onUpdate: async (id, opData) => {
          await updateGoal(id, opData as Partial<GoalWithCounts>)
        },
        onDelete: async (id) => {
          await deleteGoal(id)
        },
      })
      clearPreview()
    } finally {
      setIsApplying(false)
    }
  }, [preview, applyOperations, createGoal, updateGoal, deleteGoal, clearPreview])

  return (
    <AppShell>
      {aiEnabled && <AIEditBar onSubmit={handleAICommand} isLoading={isAILoading} placeholder="Ask AI to edit goals..." />}

      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">Goals</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Track your goals and tasks.
        </p>

        {isLoading && goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : (
          <GoalList
            goals={goals}
            onDelete={deleteGoal}
            onEdit={handleEditGoal}
          />
        )}
      </div>

      <RouteButton
        onClick={() => {
          setEditingGoal(null)
          setSheetOpen(true)
        }}
        aria-label="Add goal"
      />

      <AddGoalSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal}
        goal={editingGoal}
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
