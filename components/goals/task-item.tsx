"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import type { Layer } from "@/types"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Layer
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const isDone = task.status === "done"

  return (
    <div className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) => {
          onToggle(task.id, Boolean(checked))
        }}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.name}
        </p>
        {task.description ? (
          <p
            className={cn(
              "mt-0.5 text-xs text-muted-foreground",
              isDone && "line-through"
            )}
          >
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
