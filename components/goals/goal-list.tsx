"use client"

import { useCallback, useEffect, useState } from "react"
import { useGoals } from "@/hooks/useGoals"
import { GoalCard } from "@/components/goals/goal-card"
import {
  AddGoalSheet,
  type GoalFormData,
} from "@/components/goals/add-goal-sheet"
import { GoalDetailSheet } from "@/components/goals/goal-detail-sheet"
import { RouteButton } from "@/components/shared/route-button"
import { EmptyState } from "@/components/shared/empty-state"
import type { GoalWithCounts } from "@/types"

export function GoalList() {
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } =
    useGoals()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailGoal, setDetailGoal] = useState<GoalWithCounts | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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

      <RouteButton
        onClick={() => setSheetOpen(true)}
        aria-label="Add goal"
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
    </>
  )
}
