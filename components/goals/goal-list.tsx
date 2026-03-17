"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useGoals } from "@/hooks/useGoals"
import { GoalCard } from "@/components/goals/goal-card"
import {
  AddGoalSheet,
  type GoalFormData,
} from "@/components/goals/add-goal-sheet"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { RouteButton } from "@/components/shared/route-button"
import { EmptyState } from "@/components/shared/empty-state"
import type { GoalWithCounts } from "@/types"

export function GoalList() {
  const router = useRouter()
  const { goals, isLoading, fetchGoals, createGoal, updateGoal, deleteGoal } =
    useGoals()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithCounts | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

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
    async (data: GoalFormData) => {
      if (!editingGoal) {
        return
      }
      await updateGoal(editingGoal.id, {
        name: data.name,
        description: data.description,
        target_value: data.target_value,
        due_date: data.due_date,
      })
      setEditingGoal(null)
    },
    [editingGoal, updateGoal]
  )

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingGoal(null)
    }
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
                onTap={() => router.push(`/g/${goal.id}/t`)}
                onEdit={() => {
                  setEditingGoal(goal)
                  setSheetOpen(true)
                }}
                onDelete={() => setDeletingGoalId(goal.id)}
              />
            ))}
          </div>
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
        onSubmit={editingGoal ? handleUpdate : handleCreate}
        goal={editingGoal}
      />
      <AlertDialog
        open={deletingGoalId !== null}
        onOpenChange={(open) => { if (!open) setDeletingGoalId(null) }}
        title="Delete goal?"
        description="This action cannot be undone. All tasks under this goal will also be removed."
        onConfirm={() => {
          if (deletingGoalId) {
            deleteGoal(deletingGoalId)
            setDeletingGoalId(null)
          }
        }}
      />
    </>
  )
}
