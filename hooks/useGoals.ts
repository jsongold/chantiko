"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useGoalStore } from "@/store/goalStore"
import type { GoalWithCounts } from "@/types"

export function useGoals() {
  const {
    goals,
    isLoading,
    setGoals,
    addGoal,
    updateGoal,
    removeGoal,
    setLoading,
  } = useGoalStore()

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<GoalWithCounts[]>("/goals")

      if (response.success && response.data) {
        setGoals(response.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, setGoals])

  const createGoal = useCallback(
    async (data: { name: string; description?: string; due_date?: string | null; target_value?: string | null; status?: string }) => {
      const response = await api.post<GoalWithCounts>("/goals", data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to create goal")
      }

      addGoal(response.data)
      return response.data
    },
    [addGoal]
  )

  const handleUpdateGoal = useCallback(
    async (id: string, data: Partial<GoalWithCounts>) => {
      const response = await api.patch<GoalWithCounts>(`/goals/${id}`, data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update goal")
      }

      updateGoal(id, response.data)
      return response.data
    },
    [updateGoal]
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      const response = await api.delete(`/goals/${id}`)

      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete goal")
      }

      removeGoal(id)
    },
    [removeGoal]
  )

  return {
    goals,
    isLoading,
    fetchGoals,
    createGoal,
    updateGoal: handleUpdateGoal,
    deleteGoal,
  }
}
