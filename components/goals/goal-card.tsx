"use client"

import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import type { GoalWithCounts } from "@/types"

interface GoalCardProps {
  goal: GoalWithCounts
  onDelete: (id: string) => void
  onEdit: (goal: GoalWithCounts) => void
}

export function GoalCard({ goal, onDelete, onEdit }: GoalCardProps) {
  const percentage =
    goal.task_count > 0
      ? Math.round((goal.done_count / goal.task_count) * 100)
      : 0

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 p-3">
        <Link
          href={`/g/${goal.id}/t`}
          className="flex-1 min-w-0"
        >
          <p className="text-sm font-medium leading-snug truncate">
            {goal.name}
          </p>
          {goal.due_date ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Due {new Date(goal.due_date).toLocaleDateString()}
            </p>
          ) : null}
        </Link>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault()
            onEdit(goal)
          }}
          aria-label={`Edit goal ${goal.name}`}
        >
          <span className="text-xs text-muted-foreground">Edit</span>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.preventDefault()
            onDelete(goal.id)
          }}
          aria-label={`Delete goal ${goal.name}`}
        >
          <Trash2Icon className="size-3.5 text-muted-foreground" />
        </Button>
      </div>

      {goal.task_count > 0 ? (
        <div className="border-t px-3 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{goal.done_count}/{goal.task_count} tasks</span>
            <span>{percentage}%</span>
          </div>
          <Progress value={percentage} />
        </div>
      ) : null}
    </div>
  )
}
