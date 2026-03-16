export interface Activity {
  id: string
  user_id: string
  title: string
  value: string
  value_unit: string | null
  category: string
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Layer {
  id: string
  user_id: string
  type: "goal" | "task"
  name: string
  parent: string | null
  description: string
  target_value: string | null
  current_value: string | null
  status: "active" | "done" | "archived"
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface LayerNode extends Layer {
  children: LayerNode[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: Record<string, unknown>
}

export type OperationType = "create" | "update" | "delete"

export interface Operation {
  op: OperationType
  id?: string
  data?: Record<string, unknown>
}

export interface AIEditResponse {
  operations: Operation[]
  summary: string
}

export const VALUE_UNITS = [
  "minutes",
  "hours",
  "reps",
  "sets",
  "times",
  "km",
  "miles",
  "steps",
  "kg",
  "lbs",
  "pages",
  "calories",
] as const

export type ValueUnit = (typeof VALUE_UNITS)[number]

export const ACTIVITY_CATEGORIES = [
  "Exercise",
  "Study",
  "Work",
  "Other",
] as const

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]
