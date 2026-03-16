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

const taskSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  target_value: z.string().nullable(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

interface AddTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormValues) => void
  task?: Task | null
}

export function AddTaskSheet({
  open,
  onOpenChange,
  onSubmit,
  task,
}: AddTaskSheetProps) {
  const isEditMode = task !== null && task !== undefined

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      target_value: null,
    },
  })

  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        description: task.description ?? "",
        target_value: task.target_value,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        target_value: null,
      })
    }
  }, [task, form])

  const handleSubmit = (values: TaskFormValues) => {
    onSubmit(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Task" : "Add Task"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update this task."
              : "Create a new task."}
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
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
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
            <Label htmlFor="task-target">Target Value (optional)</Label>
            <Input
              id="task-target"
              placeholder="e.g. 10 pages, 30 min..."
              {...form.register("target_value")}
            />
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
