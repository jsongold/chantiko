"use client"

import { useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronRightIcon, Trash2Icon } from "lucide-react"
import { TaskItem } from "@/components/goals/task-item"
import { cn } from "@/lib/utils"
import type { LayerNode } from "@/types"

interface GoalNodeProps {
  node: LayerNode
  onToggleTask: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

function computeProgress(node: LayerNode): {
  completed: number
  total: number
} {
  const tasks = node.children.filter((c) => c.type === "task")
  const childGoals = node.children.filter((c) => c.type === "goal")

  const directCompleted = tasks.filter((t) => t.status === "done").length
  const directTotal = tasks.length

  const nested = childGoals.reduce(
    (acc, goal) => {
      const result = computeProgress(goal)
      return {
        completed: acc.completed + result.completed,
        total: acc.total + result.total,
      }
    },
    { completed: 0, total: 0 }
  )

  return {
    completed: directCompleted + nested.completed,
    total: directTotal + nested.total,
  }
}

export function GoalNode({ node, onToggleTask, onDelete }: GoalNodeProps) {
  const [isOpen, setIsOpen] = useState(true)

  const { completed, total } = computeProgress(node)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

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

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-snug">{node.name}</p>
            {node.description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {node.description}
              </p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(node.id)}
            aria-label={`Delete goal ${node.name}`}
          >
            <Trash2Icon className="size-3.5 text-muted-foreground" />
          </Button>
        </div>

        {total > 0 ? (
          <div className="px-3 pb-3">
            <Progress value={percentage}>
              <ProgressLabel className="sr-only">
                {node.name} progress
              </ProgressLabel>
              <ProgressValue>
                {(formattedValue) => formattedValue ?? `${percentage}%`}
              </ProgressValue>
            </Progress>
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {completed}/{total} tasks
            </p>
          </div>
        ) : null}

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
