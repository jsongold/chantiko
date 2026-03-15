"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useActivityStore } from "@/store/activityStore"
import type { Activity } from "@/types"

interface PaginatedActivities {
  items: Activity[]
  hasMore: boolean
  cursor: string | null
}

export function useActivities() {
  const {
    activities,
    isLoading,
    hasMore,
    cursor,
    setLoading,
    appendActivities,
    addActivity,
    removeActivity,
  } = useActivityStore()

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const path = cursor
        ? `/activities?cursor=${encodeURIComponent(cursor)}`
        : "/activities"
      const response = await api.get<PaginatedActivities>(path)

      if (response.success && response.data) {
        appendActivities(
          response.data.items,
          response.data.hasMore,
          response.data.cursor
        )
      }
    } finally {
      setLoading(false)
    }
  }, [cursor, setLoading, appendActivities])

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
          throw new Error(response.error ?? "Failed to create activity")
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
          throw new Error(response.error ?? "Failed to delete activity")
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
      throw new Error(response.error ?? "Failed to fetch history")
    }

    return response.data
  }, [])

  return {
    activities,
    isLoading,
    hasMore,
    fetchActivities,
    createActivity,
    deleteActivity,
    fetchHistory,
  }
}
