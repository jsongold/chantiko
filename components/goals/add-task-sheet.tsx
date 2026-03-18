"use client"

import { useEffect, useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { RecurrencePicker } from "@/components/tasks/recurrence-picker"
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

const taskFormSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().max(500),
    label: z.string().nullable(),
    due_date: z.string().nullable(),
    goal_id: z.string().nullable(),
    scheduled_start_at: z.string().nullable().optional(),
    scheduled_end_at: z.string().nullable().optional(),
    rrule: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduled_start_at && data.scheduled_end_at) {
        return new Date(data.scheduled_end_at) >= new Date(data.scheduled_start_at)
      }
      return true
    },
    { message: "End must be after start", path: ["scheduled_end_at"] }
  )

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
  const [scheduleEnabled, setScheduleEnabled] = useState(false)

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      label: null,
      due_date: null,
      goal_id: defaultGoalId,
      scheduled_start_at: null,
      scheduled_end_at: null,
      rrule: null,
    },
  })

  useEffect(() => {
    if (task) {
      const hasSchedule = Boolean(task.scheduled_start_at)
      setScheduleEnabled(hasSchedule)
      form.reset({
        name: task.name,
        description: task.description ?? "",
        label: task.label,
        due_date: task.due_date ? task.due_date.slice(0, 10) : null,
        goal_id: task.goal_id,
        scheduled_start_at: task.scheduled_start_at
          ? task.scheduled_start_at.slice(0, 16)
          : null,
        scheduled_end_at: task.scheduled_end_at
          ? task.scheduled_end_at.slice(0, 16)
          : null,
        rrule: task.rrule ?? null,
      })
    } else {
      setScheduleEnabled(false)
      form.reset({
        name: "",
        description: "",
        label: null,
        due_date: null,
        goal_id: defaultGoalId ?? goals[0]?.id ?? null,
        scheduled_start_at: null,
        scheduled_end_at: null,
        rrule: null,
      })
    }
  }, [task, form, defaultGoalId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (values: TaskFormData) => {
    const submitData = {
      ...values,
      scheduled_start_at: scheduleEnabled ? values.scheduled_start_at ?? null : null,
      scheduled_end_at: scheduleEnabled ? values.scheduled_end_at ?? null : null,
      rrule: scheduleEnabled ? values.rrule ?? null : null,
    }
    onSubmit(submitData)
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="schedule-toggle">Schedule</Label>
              <Switch
                id="schedule-toggle"
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>
            {scheduleEnabled && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-2">
                  <Label htmlFor="task-start">Start</Label>
                  <Input
                    id="task-start"
                    type="datetime-local"
                    {...form.register("scheduled_start_at")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-end">End</Label>
                  <Input
                    id="task-end"
                    type="datetime-local"
                    {...form.register("scheduled_end_at")}
                  />
                  {form.formState.errors.scheduled_end_at && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.scheduled_end_at.message}
                    </p>
                  )}
                </div>
                <RecurrencePicker
                  value={form.watch("rrule") ?? null}
                  onChange={(r) => form.setValue("rrule", r)}
                />
              </div>
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
