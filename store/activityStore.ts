import { create } from "zustand"
import type { Activity } from "@/types"

interface ActivityState {
  activities: Activity[]
  hasMore: boolean
  isLoading: boolean
  cursor: string | null
}

interface ActivityActions {
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => void
  updateActivity: (id: string, updates: Partial<Activity>) => void
  removeActivity: (id: string) => void
  appendActivities: (
    activities: Activity[],
    hasMore: boolean,
    cursor: string | null
  ) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: ActivityState = {
  activities: [],
  hasMore: true,
  isLoading: false,
  cursor: null,
}

export const useActivityStore = create<ActivityState & ActivityActions>(
  (set) => ({
    ...initialState,

    setActivities: (activities) => set({ activities: [...activities] }),

    addActivity: (activity) =>
      set((state) => ({
        activities: [activity, ...state.activities],
      })),

    updateActivity: (id, updates) =>
      set((state) => ({
        activities: state.activities.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),

    removeActivity: (id) =>
      set((state) => ({
        activities: state.activities.filter((a) => a.id !== id),
      })),

    appendActivities: (activities, hasMore, cursor) =>
      set((state) => ({
        activities: [...state.activities, ...activities],
        hasMore,
        cursor,
      })),

    setLoading: (isLoading) => set({ isLoading }),

    reset: () => set({ ...initialState }),
  })
)
