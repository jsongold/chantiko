"use client"

import { useCallback, useEffect, useState } from "react"
import { useGoals } from "@/hooks/useGoals"
import { GoalCard } from "@/components/goals/goal-card"
import {
  AddGoalSheet,
  type GoalFormData,
} from "@/components/goals/add-goal-sheet"
import { GoalDetailSheet } from "@/components/goals/goal-detail-sheet"
import { ChikoFab } from "@/components/shared/chiko-fab"
import { AIChatSheet } from "@/components/ai/ai-chat-sheet"
import { useAIChatHandlers } from "@/hooks/useAIChatHandlers"
import { EmptyState } from "@/components/shared/empty-state"
import { features } from "@/lib/features"
import type { GoalWithCounts } from "@/types"

export function GoalList() {
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } =
    useGoals()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [aiChatOpen, setAIChatOpen] = useState(false)
  const [detailGoal, setDetailGoal] = useState<GoalWithCounts | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const aiHandlers = useAIChatHandlers({
    entityType: "goal",
    crud: {
      create: async (data) => {
        await createGoal({
          name: String(data.name ?? ""),
          description: data.description != null ? String(data.description) : undefined,
          target_value: data.target_value != null ? String(data.target_value) : undefined,
          due_date: data.due_date != null ? String(data.due_date) : undefined,
          status: "active",
        })
      },
      update: async (id, data) => {
        await updateGoal(id, {
          name: data.name != null ? String(data.name) : undefined,
          description: data.description != null ? String(data.description) : undefined,
          target_value: data.target_value != null ? String(data.target_value) : undefined,
          due_date: data.due_date != null ? String(data.due_date) : undefined,
        })
      },
      delete: async (id) => {
        await deleteGoal(id)
      },
    },
  })

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleCreate = useCallback(
    async (data: GoalFormData) => {
      await createGoal({
        name: data.name,
        description: data.description,
        target_value: data.target_value,
        due_date: data.due_date,
        status: "active",
      })
    },
    [createGoal]
  )

  const handleUpdate = useCallback(
    async (id: string, data: GoalFormData) => {
      await updateGoal(id, {
        name: data.name,
        description: data.description,
        target_value: data.target_value,
        due_date: data.due_date,
      })
    },
    [updateGoal]
  )

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
  }, [])

  return (
    <>
      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">Goals</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Track your goals and tasks.
        </p>

        {isLoading && goals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : goals.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Tap the + button to create your first goal."
          />
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onTap={() => {
                  setDetailGoal(goal)
                  setDetailOpen(true)
                }}
                onDelete={() => deleteGoal(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ChikoFab
        onManualOpen={() => setSheetOpen(true)}
        onAIOpen={() => setAIChatOpen(true)}
        manualLabel="Add goal"
      />

      <AddGoalSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={handleCreate}
      />

      <GoalDetailSheet
        goal={detailGoal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleUpdate}
      />

      {features.aiChat && (
        <AIChatSheet
          open={aiChatOpen}
          onOpenChange={setAIChatOpen}
          handlers={aiHandlers}
          context={{ page: "goals", goals: goals.map((g) => ({ id: g.id, name: g.name })) }}
        />
      )}
    </>
  )
}
