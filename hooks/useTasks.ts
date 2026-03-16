"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useTaskStore } from "@/store/taskStore"
import { useGoalStore } from "@/store/goalStore"
import type { Task } from "@/types"

export function useTasks() {
  const {
    tasks,
    isLoading,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
  } = useTaskStore()
  const { updateGoal } = useGoalStore()

  const fetchTasks = useCallback(
    async (goalId: string) => {
      setLoading(true)
      try {
        const response = await api.get<Task[]>(`/tasks?goal_id=${goalId}`)

        if (response.success && response.data) {
          setTasks(response.data)
        }
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setTasks]
  )

  const createTask = useCallback(
    async (data: {
      goal_id: string
      name: string
      label?: string | null
      description?: string
      target_value?: string | null
      current_value?: string | null
      status?: string
    }) => {
      const response = await api.post<Task>("/tasks", data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to create task")
      }

      addTask(response.data)
      updateGoal(data.goal_id, {})
      return response.data
    },
    [addTask, updateGoal]
  )

  const handleUpdateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      const response = await api.patch<Task>(`/tasks/${id}`, data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update task")
      }

      updateTask(id, response.data)
      return response.data
    },
    [updateTask]
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const response = await api.delete(`/tasks/${id}`)

      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete task")
      }

      removeTask(id)
    },
    [removeTask]
  )

  return {
    tasks,
    isLoading,
    fetchTasks,
    createTask,
    updateTask: handleUpdateTask,
    deleteTask,
  }
}
