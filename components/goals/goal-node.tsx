"use client"

import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import { Button } from "@/components/ui/button"
import { ChevronRightIcon, Trash2Icon } from "lucide-react"
import { TaskItem } from "@/components/goals/task-item"
import { cn } from "@/lib/utils"
import type { LayerNode } from "@/types"

interface GoalNodeProps {
  node: LayerNode
  onToggleTask: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit?: (layer: LayerNode) => void
}

export function GoalNode({ node, onToggleTask, onDelete, onEdit }: GoalNodeProps) {
  const [isOpen, setIsOpen] = useState(true)

  const childGoals = node.children.filter((c) => c.type === "goal")
  const childTasks = node.children.filter((c) => c.type === "task")
  const hasChildren = node.children.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 p-3">
          {hasChildren ? (
            <CollapsibleTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <ChevronRightIcon
                className={cn(
                  "size-4 transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </CollapsibleTrigger>
          ) : (
            <div className="size-7" />
          )}

          <p
            className="flex-1 min-w-0 text-sm font-medium leading-snug cursor-pointer active:opacity-70"
            onClick={() => onEdit?.(node)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onEdit?.(node)
              }
            }}
          >
            {node.name}
          </p>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(node.id)}
            aria-label={`Delete goal ${node.name}`}
          >
            <Trash2Icon className="size-3.5 text-muted-foreground" />
          </Button>
        </div>

        {hasChildren ? (
          <CollapsibleContent>
            <div className="border-t px-3 pb-3 pt-2">
              {childTasks.length > 0 ? (
                <div className="space-y-1">
                  {childTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              ) : null}

              {childGoals.length > 0 ? (
                <div className={cn("space-y-2", childTasks.length > 0 && "mt-3")}>
                  {childGoals.map((goal) => (
                    <GoalNode
                      key={goal.id}
                      node={goal}
                      onToggleTask={onToggleTask}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        ) : null}
      </div>
    </Collapsible>
  )
}
