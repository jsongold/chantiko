"use client"

import { GoalCard } from "@/components/goals/goal-card"
import { EmptyState } from "@/components/shared/empty-state"
import type { GoalWithCounts } from "@/types"

interface GoalListProps {
  goals: GoalWithCounts[]
  onDelete: (id: string) => void
  onEdit: (goal: GoalWithCounts) => void
}

export function GoalList({ goals, onDelete, onEdit }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        title="No goals yet"
        description="Tap the + button to create your first goal."
      />
    )
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
