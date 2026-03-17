"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useTaskStore } from "@/store/taskStore"
import type { Task } from "@/types"

export function useTasks(goalId: string) {
  const {
    tasks,
    isLoading,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
  } = useTaskStore()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<Task[]>(`/tasks?goal_id=${goalId}`)

      if (response.success && response.data) {
        setTasks(response.data)
      }
    } finally {
      setLoading(false)
    }
  }, [goalId, setLoading, setTasks])

  const createTask = useCallback(
    async (data: { name: string; description?: string; label?: string | null; status?: string }) => {
      const response = await api.post<Task>("/tasks", {
        ...data,
        goal_id: goalId,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to create task")
      }

      addTask(response.data)
      return response.data
    },
    [goalId, addTask]
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
