"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useTaskStore } from "@/store/taskStore"
import type { Task } from "@/types"

export function useTasks(goalId: string) {
  const {
    tasks,
    isLoading,
    hasMore,
    addTask,
    updateTask,
    removeTask,
    appendTasks,
    setLoading,
    reset,
  } = useTaskStore()

  const fetchTasks = useCallback(async () => {
    reset()
    setLoading(true)
    try {
      const response = await api.get<Task[]>(`/tasks?goal_id=${goalId}`)

      if (response.success && response.data) {
        const nextCursor = response.meta?.next_cursor as { cursor_created_at: string; cursor_id: string } | null | undefined
        const hasMoreItems = nextCursor !== null && nextCursor !== undefined
        const cursorStr = nextCursor ? `cursor_created_at=${nextCursor.cursor_created_at}&cursor_id=${nextCursor.cursor_id}` : null
        useTaskStore.setState({
          tasks: response.data,
          hasMore: hasMoreItems,
          cursor: cursorStr,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [goalId, reset, setLoading])

  const fetchMoreTasks = useCallback(async () => {
    const currentCursor = useTaskStore.getState().cursor
    if (!currentCursor) return
    setLoading(true)
    try {
      const response = await api.get<Task[]>(`/tasks?goal_id=${goalId}&${currentCursor}`)

      if (response.success && response.data) {
        const nextCursor = response.meta?.next_cursor as { cursor_created_at: string; cursor_id: string } | null | undefined
        const hasMoreItems = nextCursor !== null && nextCursor !== undefined
        const cursorStr = nextCursor ? `cursor_created_at=${nextCursor.cursor_created_at}&cursor_id=${nextCursor.cursor_id}` : null
        appendTasks(response.data, hasMoreItems, cursorStr)
      }
    } finally {
      setLoading(false)
    }
  }, [goalId, appendTasks, setLoading])

  const createTask = useCallback(
    async (data: { name: string; description?: string; label?: string | null; due_date?: string | null; status?: string }) => {
      const response = await api.post<Task>("/tasks", {
        ...data,
        goal_id: goalId,
      })

      if (!response.success || !response.data) {
        const err = response.error ?? "Failed to create task"
        console.error("[Tasks] create failed:", err)
        throw new Error(err)
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
        const err = response.error ?? "Failed to update task"
        console.error("[Tasks] update failed:", err)
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
        console.error("[Tasks] delete failed:", err)
        throw new Error(err)
      }

      removeTask(id)
    },
    [removeTask]
  )

  return {
    tasks,
    isLoading,
    hasMore,
    fetchTasks,
    fetchMoreTasks,
    createTask,
    updateTask: handleUpdateTask,
    deleteTask,
  }
}
