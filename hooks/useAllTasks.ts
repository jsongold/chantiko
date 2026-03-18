"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useAllTaskStore } from "@/store/allTaskStore"
import type { Task } from "@/types"

export function useAllTasks() {
  const {
    tasks,
    isLoading,
    setTasks,
    addTask,
    updateTask,
    removeTask,
    setLoading,
  } = useAllTaskStore()

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<Task[]>("/tasks")

      if (response.success && response.data) {
        setTasks(response.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, setTasks])

  const createTask = useCallback(
    async (data: { goal_id: string; name: string; description?: string; label?: string | null; due_date?: string | null; scheduled_start_at?: string | null; scheduled_end_at?: string | null; status?: string }) => {
      const response = await api.post<Task>("/tasks", data)

      if (!response.success || !response.data) {
        const err = response.error ?? "Failed to create task"
        throw new Error(err)
      }

      addTask(response.data)
      return response.data
    },
    [addTask]
  )

  const handleUpdateTask = useCallback(
    async (id: string, data: Partial<Task>) => {
      const response = await api.patch<Task>(`/tasks/${id}`, data)

      if (!response.success || !response.data) {
        const err = response.error ?? "Failed to update task"
        throw new Error(err)
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
        const err = response.error ?? "Failed to delete task"
        throw new Error(err)
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
