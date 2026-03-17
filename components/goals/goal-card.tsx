"use client"

import { format, parseISO } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon } from "lucide-react"
import type { GoalWithCounts } from "@/types"

interface GoalCardProps {
  goal: GoalWithCounts
  onTap: () => void
  onEdit: () => void
  onDelete: () => void
}

export function GoalCard({ goal, onTap, onEdit, onDelete }: GoalCardProps) {
  const progress =
    goal.task_count > 0
      ? Math.round((goal.done_count / goal.task_count) * 100)
      : 0

  return (
    <div
      className="flex items-center gap-3 rounded-lg border bg-card p-3 cursor-pointer active:opacity-70"
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onTap()
        }
      }}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium leading-snug truncate">
          {goal.name}
        </p>

        {goal.task_count > 0 && (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              {goal.done_count}/{goal.task_count}
            </span>
          </div>
        )}

        {goal.due_date && (
          <p className="text-xs text-muted-foreground">
            Due {format(parseISO(goal.due_date), "MMM d")}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation()
          onEdit()
        }}
        aria-label={`Edit goal ${goal.name}`}
      >
        <PencilIcon className="size-3.5 text-muted-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        aria-label={`Delete goal ${goal.name}`}
      >
        <Trash2Icon className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
