"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTasks } from "@/hooks/useTasks"
import { TaskCard } from "@/components/goals/task-card"
import {
  AddTaskSheet,
  type TaskFormData,
} from "@/components/goals/add-task-sheet"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRightIcon } from "lucide-react"
import { RouteButton } from "@/components/shared/route-button"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"

interface TaskListProps {
  goalId: string
  goalName: string
}

interface LabelGroup {
  label: string | null
  tasks: Task[]
}

function groupByLabel(tasks: Task[]): LabelGroup[] {
  const map = new Map<string | null, Task[]>()
  for (const task of tasks) {
    const key = task.label
    const existing = map.get(key) ?? []
    map.set(key, [...existing, task])
  }

  const groups: LabelGroup[] = []
  for (const [label, items] of map) {
    if (label !== null) {
      groups.push({ label, tasks: items })
    }
  }
  const ungrouped = map.get(null)
  if (ungrouped) {
    groups.push({ label: null, tasks: ungrouped })
  }
  return groups
}

export function TaskList({ goalId, goalName }: TaskListProps) {
  const { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask } =
    useTasks(goalId)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const labelGroups = useMemo(() => groupByLabel(tasks), [tasks])

  const existingLabels = useMemo(
    () => [...new Set(tasks.map((t) => t.label).filter((l): l is string => l !== null))],
    [tasks]
  )

  const handleCreate = useCallback(
    async (data: TaskFormData) => {
      await createTask({
        name: data.name,
        description: data.description,
        label: data.label,
        due_date: data.due_date,
        status: "active",
      })
    },
    [createTask]
  )

  const handleUpdate = useCallback(
    async (data: TaskFormData) => {
      if (!editingTask) {
        return
      }
      await updateTask(editingTask.id, {
        name: data.name,
        description: data.description,
        label: data.label,
      })
      setEditingTask(null)
    },
    [editingTask, updateTask]
  )

  const handleToggle = useCallback(
    async (task: Task) => {
      const newStatus = task.status === "done" ? "active" : "done"
      await updateTask(task.id, { status: newStatus })
    },
    [updateTask]
  )

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }, [])

  return (
    <>
      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">{goalName}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Tasks for this goal.
        </p>

        {isLoading && tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Tap the + button to add your first task."
          />
        ) : (
          <div className="space-y-4">
            {labelGroups.map((group) => {
              const doneCount = group.tasks.filter((t) => t.status === "done").length
              const totalCount = group.tasks.length

              return (
                <Collapsible key={group.label ?? "__ungrouped"} defaultOpen>
                  <CollapsibleTrigger className="flex w-full items-center gap-1.5 mb-1 group">
                    <ChevronRightIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {group.label ?? "Ungrouped"}
                    </span>
                    <span className={cn(
                      "ml-auto text-xs tabular-nums",
                      doneCount === totalCount
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}>
                      {doneCount}/{totalCount}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 rounded-lg border bg-card">
                      {group.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onToggle={() => handleToggle(task)}
                          onTap={() => {
                            setEditingTask(task)
                            setSheetOpen(true)
                          }}
                          onDelete={() => deleteTask(task.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </div>

      <RouteButton
        onClick={() => {
          setEditingTask(null)
          setSheetOpen(true)
        }}
        aria-label="Add task"
      />

      <AddTaskSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
        existingLabels={existingLabels}
      />
    </>
  )
}
