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
import type { GoalWithCounts } from "@/types"

const goalSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  target_value: z.string().nullable(),
  due_date: z.string().nullable(),
})

export type GoalFormValues = z.infer<typeof goalSchema>

interface AddGoalSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GoalFormValues) => void
  goal?: GoalWithCounts | null
}

export function AddGoalSheet({
  open,
  onOpenChange,
  onSubmit,
  goal,
}: AddGoalSheetProps) {
  const isEditMode = goal !== null && goal !== undefined

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      description: "",
      target_value: null,
      due_date: null,
    },
  })

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        description: goal.description ?? "",
        target_value: goal.target_value,
        due_date: goal.due_date ?? null,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        target_value: null,
        due_date: null,
      })
    }
  }, [goal, form])

  const handleSubmit = (values: GoalFormValues) => {
    onSubmit(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Goal" : "Add Goal"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update this goal."
              : "Create a new goal to track."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-2">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              placeholder="Enter goal name..."
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
            <Label htmlFor="goal-description">Description</Label>
            <Textarea
              id="goal-description"
              placeholder="Optional description..."
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Value (optional)</Label>
            <Input
              id="goal-target"
              placeholder="e.g. 10 books, 5km..."
              {...form.register("target_value")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-due-date">Due Date (optional)</Label>
            <Input
              id="goal-due-date"
              type="date"
              {...form.register("due_date")}
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
