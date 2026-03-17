"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useActivityStore } from "@/store/activityStore"
import type { Activity } from "@/types"

export function useActivities() {
  const {
    activities,
    isLoading,
    hasMore,
    setLoading,
    appendActivities,
    addActivity,
    removeActivity,
  } = useActivityStore()

  const fetchActivities = useCallback(async () => {
    const currentCursor = useActivityStore.getState().cursor
    setLoading(true)
    try {
      const path = currentCursor
        ? `/activities?cursor=${encodeURIComponent(currentCursor)}`
        : "/activities"
      const response = await api.get<Activity[]>(path)

      if (response.success && response.data) {
        const nextCursor = response.meta?.next_cursor as { cursor_created_at: string; cursor_id: string } | null | undefined
        const hasMoreItems = nextCursor !== null && nextCursor !== undefined
        const cursorStr = nextCursor ? `cursor_created_at=${nextCursor.cursor_created_at}&cursor_id=${nextCursor.cursor_id}` : null

        if (!currentCursor) {
          // First page — replace
          useActivityStore.setState({
            activities: response.data,
            hasMore: hasMoreItems,
            cursor: cursorStr,
          })
        } else {
          appendActivities(response.data, hasMoreItems, cursorStr)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, appendActivities])

  const createActivity = useCallback(
    async (data: Omit<Activity, "id" | "user_id" | "is_deleted" | "created_at" | "updated_at">) => {
      const tempId = crypto.randomUUID()
      const now = new Date().toISOString()
      const optimistic: Activity = {
        ...data,
        id: tempId,
        user_id: "",
        is_deleted: false,
        created_at: now,
        updated_at: now,
      }

      addActivity(optimistic)

      try {
        const response = await api.post<Activity>("/activities", data)

        if (!response.success || !response.data) {
          removeActivity(tempId)
          const err = response.error ?? "Failed to create activity"
          console.error("[Activities] create failed:", err)
          throw new Error(err)
        }

        removeActivity(tempId)
        addActivity(response.data)
        return response.data
      } catch (error) {
        removeActivity(tempId)
        throw error
      }
    },
    [addActivity, removeActivity]
  )

  const handleUpdateActivity = useCallback(
    async (id: string, data: Partial<Omit<Activity, "id" | "user_id" | "is_deleted" | "created_at" | "updated_at">>) => {
      const response = await api.patch<Activity>(`/activities/${id}`, data)

      if (!response.success || !response.data) {
        const err = response.error ?? "Failed to update activity"
        console.error("[Activities] update failed:", err)
        throw new Error(err)
      }

      useActivityStore.getState().updateActivity(id, response.data)
      return response.data
    },
    []
  )

  const deleteActivity = useCallback(
    async (id: string) => {
      const existing = activities.find((a) => a.id === id)
      removeActivity(id)

      try {
        const response = await api.delete(`/activities/${id}`)

        if (!response.success) {
          if (existing) {
            addActivity(existing)
          }
          const err = response.error ?? "Failed to delete activity"
          console.error("[Activities] delete failed:", err)
          throw new Error(err)
        }
      } catch (error) {
        if (existing) {
          addActivity(existing)
        }
        throw error
      }
    },
    [activities, removeActivity, addActivity]
  )

  const fetchHistory = useCallback(async (): Promise<string[]> => {
    const response = await api.get<string[]>("/activities/history")

    if (!response.success || !response.data) {
      const err = response.error ?? "Failed to fetch history"
      console.error("[Activities] history failed:", err)
      throw new Error(err)
    }

    return response.data
  }, [])

  return {
    activities,
    isLoading,
    hasMore,
    fetchActivities,
    createActivity,
    updateActivity: handleUpdateActivity,
    deleteActivity,
    fetchHistory,
  }
}
