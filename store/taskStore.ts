import { create } from "zustand"
import type { Task } from "@/types"

interface TaskState {
  tasks: Task[]
  isLoading: boolean
}

interface TaskActions {
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
}

export const useTaskStore = create<TaskState & TaskActions>((set) => ({
  ...initialState,

  setTasks: (tasks) => set({ tasks: [...tasks] }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
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
