"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import type { Task } from "@/types"

export interface GoalOption {
  id: string
  name: string
}

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  label: z.string().nullable(),
  due_date: z.string().nullable(),
  goal_id: z.string().nullable(),
})

export type TaskFormData = z.infer<typeof taskFormSchema>

interface AddTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => void
  task?: Task | null
  existingLabels?: string[]
  goals?: GoalOption[]
  defaultGoalId?: string | null
}

export function AddTaskSheet({
  open,
  onOpenChange,
  onSubmit,
  task,
  existingLabels = [],
  goals = [],
  defaultGoalId = null,
}: AddTaskSheetProps) {
  const isEditMode = task !== null && task !== undefined

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      label: null,
      due_date: null,
      goal_id: defaultGoalId,
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        description: task.description ?? "",
        label: task.label,
        due_date: task.due_date ? task.due_date.slice(0, 10) : null,
        goal_id: task.goal_id,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        label: null,
        due_date: null,
        goal_id: defaultGoalId ?? goals[0]?.id ?? null,
      })
    }
  }, [task, form, defaultGoalId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (values: TaskFormData) => {
    onSubmit(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Task" : "New Task"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update this task." : "Add a new task."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              placeholder="Enter task name..."
              {...form.register("name")}
              aria-invalid={Boolean(form.formState.errors.name)}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Optional description..."
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due date (optional)</Label>
            <Input
              id="task-due-date"
              type="date"
              {...form.register("due_date")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-label">Label (optional)</Label>
            <Input
              id="task-label"
              placeholder="e.g. Sprint 1, Phase A..."
              list="label-suggestions"
              {...form.register("label")}
            />
            {existingLabels.length > 0 && (
              <datalist id="label-suggestions">
                {existingLabels.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
            )}
          </div>

          {goals.length > 0 && (
            <div className="space-y-2">
              <Label>Goal</Label>
              <Select
                value={form.watch("goal_id") ?? ""}
                onValueChange={(value) =>
                  form.setValue("goal_id", value || null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SheetFooter>
            <Button type="submit" className="w-full">
              {isEditMode ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
