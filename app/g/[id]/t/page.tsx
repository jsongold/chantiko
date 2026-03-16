"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { TaskCard } from "@/components/goals/task-card"
import {
  AddTaskSheet,
  type TaskFormValues,
} from "@/components/goals/add-task-sheet"
import { useTasks } from "@/hooks/useTasks"
import { useGoals } from "@/hooks/useGoals"
import { EmptyState } from "@/components/shared/empty-state"
import { RouteButton } from "@/components/shared/route-button"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import type { Task } from "@/types"

export default function TasksPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const { goals, fetchGoals } = useGoals()
  const { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask } =
    useTasks()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const goal = goals.find((g) => g.id === goalId)

  useEffect(() => {
    if (goals.length === 0) {
      fetchGoals()
    }
  }, [goals.length, fetchGoals])

  useEffect(() => {
    if (goalId) {
      fetchTasks(goalId)
    }
  }, [goalId, fetchTasks])

  const handleToggleTask = useCallback(
    async (id: string, done: boolean) => {
      await updateTask(id, { status: done ? "done" : "active" })
    },
    [updateTask]
  )

  const handleAddTask = useCallback(
    async (data: TaskFormValues) => {
      await createTask({
        goal_id: goalId,
        name: data.name,
        description: data.description,
        target_value: data.target_value,
      })
    },
    [createTask, goalId]
  )

  const handleUpdateTask = useCallback(
    async (data: TaskFormValues) => {
      if (!editingTask) {
        return
      }
      await updateTask(editingTask.id, {
        name: data.name,
        description: data.description,
        target_value: data.target_value,
      })
      setEditingTask(null)
    },
    [editingTask, updateTask]
  )

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }, [])

  return (
    <AppShell>
      <div className="p-4 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/g")}
            aria-label="Back to goals"
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {goal?.name ?? "Tasks"}
            </h2>
            {goal?.description ? (
              <p className="text-xs text-muted-foreground truncate">
                {goal.description}
              </p>
            ) : null}
          </div>
        </div>

        {isLoading && tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Tap the + button to add a task to this goal."
          />
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={deleteTask}
                onEdit={handleEditTask}
              />
            ))}
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
        onSubmit={editingTask ? handleUpdateTask : handleAddTask}
        task={editingTask}
      />
    </AppShell>
  )
}
