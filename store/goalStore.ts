import { create } from "zustand"
import type { GoalWithCounts } from "@/types"

interface GoalState {
  goals: GoalWithCounts[]
  isLoading: boolean
}

interface GoalActions {
  setGoals: (goals: GoalWithCounts[]) => void
  addGoal: (goal: GoalWithCounts) => void
  updateGoal: (id: string, updates: Partial<GoalWithCounts>) => void
  removeGoal: (id: string) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: GoalState = {
  goals: [],
  isLoading: false,
}

export const useGoalStore = create<GoalState & GoalActions>((set) => ({
  ...initialState,

  setGoals: (goals) => set({ goals: [...goals] }),

  addGoal: (goal) =>
    set((state) => ({
      goals: [...state.goals, goal],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  removeGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ ...initialState }),
}))
