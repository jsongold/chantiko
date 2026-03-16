"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import type { Task } from "@/types"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

export function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const isDone = task.status === "done"

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5">
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) => {
          onToggle(task.id, Boolean(checked))
        }}
        className="mt-0.5"
      />
      <div
        className={cn(
          "flex-1 min-w-0 cursor-pointer active:opacity-70",
          isDone && "line-through text-muted-foreground"
        )}
        onClick={() => onEdit(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onEdit(task)
          }
        }}
      >
        <p className="text-sm leading-snug">{task.name}</p>
        {task.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {task.description}
          </p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete task ${task.name}`}
      >
        <Trash2Icon className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
