"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import type { Layer, LayerNode } from "@/types"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Layer
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit?: (layer: LayerNode) => void
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
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
      <p
        className={cn(
          "flex-1 min-w-0 text-sm leading-snug cursor-pointer active:opacity-70",
          isDone && "line-through text-muted-foreground"
        )}
        onClick={() => onEdit?.({ ...task, children: [] } as LayerNode)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onEdit?.({ ...task, children: [] } as LayerNode)
          }
        }}
      >
        {task.name}
      </p>
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
