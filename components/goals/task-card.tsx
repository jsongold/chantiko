"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import type { Task } from "@/types"

interface TaskCardProps {
  task: Task
  onToggle: () => void
  onTap: () => void
  onDelete: () => void
}

export function TaskCard({ task, onToggle, onTap, onDelete }: TaskCardProps) {
  const isDone = task.status === "done"

  return (
    <div className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
      <Checkbox
        checked={isDone}
        onCheckedChange={() => onToggle()}
        className="mt-0.5"
      />
      <p
        className={cn(
          "flex-1 min-w-0 text-sm leading-snug cursor-pointer active:opacity-70",
          isDone && "line-through text-muted-foreground"
        )}
        onClick={onTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onTap()
          }
        }}
      >
        {task.name}
        {task.description && (
          <span className="block text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </span>
        )}
        {task.due_date && (
          <span className="text-xs text-muted-foreground mt-0.5">
            {format(parseISO(task.due_date), "MMM d")}
          </span>
        )}
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onTap}
        aria-label={`Edit task ${task.name}`}
      >
        <PencilIcon className="size-3.5 text-muted-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`Delete task ${task.name}`}
      >
        <Trash2Icon className="size-3.5 text-muted-foreground" />
      </Button>
    </div>
  )
}
