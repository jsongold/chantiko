"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isToday, isYesterday, format, parseISO } from "date-fns"
import { useAllTasks } from "@/hooks/useAllTasks"
import { TaskCard } from "@/components/goals/task-card"
import {
  AddTaskSheet,
  type TaskFormData,
} from "@/components/goals/add-task-sheet"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { ChikoFab } from "@/components/shared/chiko-fab"
import { AIChatSheet } from "@/components/ai/ai-chat-sheet"
import { useAIChatHandlers } from "@/hooks/useAIChatHandlers"
import { EmptyState } from "@/components/shared/empty-state"
import { features } from "@/lib/features"
import { api } from "@/lib/api"
import type { Task, GoalWithCounts } from "@/types"

function formatDateLabel(dateString: string): string {
  const date = parseISO(dateString)
  if (isToday(date)) {
    return "Today"
  }
  if (isYesterday(date)) {
    return "Yesterday"
  }
  return format(date, "MMM d")
}

function toDateKey(task: Task): string {
  if (task.due_date) {
    return task.due_date.slice(0, 10)
  }
  return task.created_at.slice(0, 10)
}

interface DateGroup {
  dateKey: string
  label: string
  tasks: Task[]
}

function groupTasksByDate(tasks: Task[]): DateGroup[] {
  const groups: DateGroup[] = []
  let currentKey = ""

  for (const task of tasks) {
    const key = toDateKey(task)
    if (key !== currentKey) {
      currentKey = key
      groups.push({
        dateKey: key,
        label: formatDateLabel(key),
        tasks: [task],
      })
    } else {
      groups[groups.length - 1].tasks.push(task)
    }
  }

  return groups
}

interface AllTaskListProps {
  viewSwitcher?: React.ReactNode
}

export function AllTaskList({ viewSwitcher }: AllTaskListProps = {}) {
  const { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask } =
    useAllTasks()
  const [goals, setGoals] = useState<GoalWithCounts[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [aiChatOpen, setAIChatOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  const aiHandlers = useAIChatHandlers({
    entityType: "task",
    crud: {
      create: async (data) => {
        const goalId = goals[0]?.id
        if (!goalId) return
        await createTask({
          goal_id: goalId,
          name: String(data.name ?? ""),
          description: data.description != null ? String(data.description) : undefined,
          label: data.label != null ? String(data.label) : undefined,
          due_date: data.due_date != null ? String(data.due_date) : undefined,
          status: "active",
        })
      },
      update: async (id, data) => {
        await updateTask(id, {
          name: data.name != null ? String(data.name) : undefined,
          description: data.description != null ? String(data.description) : undefined,
          label: data.label != null ? String(data.label) : undefined,
        })
      },
      delete: async (id) => {
        await deleteTask(id)
      },
    },
  })

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    api
      .get<GoalWithCounts[]>("/goals")
      .then((res) => {
        if (res.success && res.data) {
          setGoals(res.data)
        }
      })
      .catch(() => {})
  }, [])

  const goalMap = useMemo(
    () => new Map(goals.map((g) => [g.id, g.name])),
    [goals]
  )

  const dateGroups = useMemo(() => groupTasksByDate(tasks), [tasks])

  const handleCreate = useCallback(
    async (data: TaskFormData) => {
      const goalId = data.goal_id ?? selectedGoalId ?? goals[0]?.id
      if (!goalId) {
        return
      }
      await createTask({
        goal_id: goalId,
        name: data.name,
        description: data.description,
        label: data.label,
        due_date: data.due_date,
        scheduled_start_at: data.scheduled_start_at ?? null,
        scheduled_end_at: data.scheduled_end_at ?? null,
        rrule: data.rrule ?? null,
        status: "active",
      })
      setSelectedGoalId(null)
    },
    [createTask, goals, selectedGoalId]
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
        due_date: data.due_date,
        scheduled_start_at: data.scheduled_start_at ?? null,
        scheduled_end_at: data.scheduled_end_at ?? null,
        rrule: data.rrule ?? null,
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
      setSelectedGoalId(null)
    }
  }, [])

  return (
    <>
      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">Tasks</h2>
        {viewSwitcher && <div className="mt-1 mb-3">{viewSwitcher}</div>}
        <p className="mb-4 text-sm text-muted-foreground">
          All tasks across your goals.
        </p>

        {isLoading && tasks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Create a goal first, then add tasks to it."
          />
        ) : (
          <div className="flex flex-col">
            {dateGroups.map((group) => (
              <div key={group.dateKey}>
                <p className="sticky top-0 z-10 bg-background px-0 py-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={() => handleToggle(task)}
                      onTap={() => {
                        setEditingTask(task)
                        setSheetOpen(true)
                      }}
                      onDelete={() => setDeletingTaskId(task.id)}
                      goalName={goalMap.get(task.goal_id) ?? null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChikoFab
        onManualOpen={() => {
          setEditingTask(null)
          setSheetOpen(true)
        }}
        onAIOpen={() => setAIChatOpen(true)}
        manualLabel="Add task"
      />

      <AddTaskSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
        goals={editingTask ? [] : goals}
        defaultGoalId={selectedGoalId ?? goals[0]?.id ?? null}
      />

      <AlertDialog
        open={deletingTaskId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingTaskId(null)
        }}
        title="Delete task?"
        description="This action cannot be undone."
        onConfirm={() => {
          if (deletingTaskId) {
            deleteTask(deletingTaskId)
            setDeletingTaskId(null)
          }
        }}
      />

      {features.aiChat && (
        <AIChatSheet
          open={aiChatOpen}
          onOpenChange={setAIChatOpen}
          handlers={aiHandlers}
          context={{
            page: "tasks",
            goals: goals.map((g) => ({ id: g.id, name: g.name })),
            tasks: tasks.slice(0, 10).map((t) => ({ id: t.id, name: t.name, status: t.status })),
          }}
        />
      )}
    </>
  )
}
