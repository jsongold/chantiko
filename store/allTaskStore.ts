import { create } from "zustand"
import type { Task } from "@/types"

interface AllTaskState {
  tasks: Task[]
  isLoading: boolean
}

interface AllTaskActions {
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: AllTaskState = {
  tasks: [],
  isLoading: false,
}

export const useAllTaskStore = create<AllTaskState & AllTaskActions>((set) => ({
  ...initialState,

  setTasks: (tasks) => set({ tasks: [...tasks] }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ ...initialState }),
}))
