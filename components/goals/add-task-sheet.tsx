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
import type { Task } from "@/types"

const taskFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  label: z.string().nullable(),
})

export type TaskFormData = z.infer<typeof taskFormSchema>

interface AddTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => void
  task?: Task | null
  existingLabels?: string[]
}

export function AddTaskSheet({
  open,
  onOpenChange,
  onSubmit,
  task,
  existingLabels = [],
}: AddTaskSheetProps) {
  const isEditMode = task !== null && task !== undefined

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      label: null,
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        description: task.description ?? "",
        label: task.label,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        label: null,
      })
    }
  }, [task, form])

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
