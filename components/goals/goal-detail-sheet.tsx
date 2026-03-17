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
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/goals/task-list"
import type { GoalWithCounts } from "@/types"

const goalFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  target_value: z.string().nullable(),
  due_date: z.string().nullable(),
})

type GoalFormData = z.infer<typeof goalFormSchema>

interface GoalDetailSheetProps {
  goal: GoalWithCounts | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, data: GoalFormData) => void
}

export function GoalDetailSheet({ goal, open, onOpenChange, onUpdate }: GoalDetailSheetProps) {
  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: { name: "", description: "", target_value: null, due_date: null },
  })

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        description: goal.description ?? "",
        target_value: goal.target_value,
        due_date: goal.due_date ?? null,
      })
    }
  }, [goal, form])

  if (!goal) return null

  const handleSubmit = (values: GoalFormData) => {
    onUpdate(goal.id, values)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[80dvh] flex flex-col pb-0">
        <SheetHeader className="shrink-0">
          <SheetTitle>{goal.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="detail-goal-name">Name</Label>
            <Input
              id="detail-goal-name"
              {...form.register("name")}
              aria-invalid={Boolean(form.formState.errors.name)}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-goal-description">Description</Label>
            <Textarea
              id="detail-goal-description"
              placeholder="Optional description..."
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-goal-target">Target Value (optional)</Label>
            <Input
              id="detail-goal-target"
              placeholder="e.g. 10 books, 5km..."
              {...form.register("target_value")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-goal-due-date">Due Date (optional)</Label>
            <Input
              id="detail-goal-due-date"
              type="date"
              {...form.register("due_date")}
            />
          </div>

          <Button type="submit" className="w-full">Save</Button>
        </form>

        <div className="border-t">
          <TaskList goalId={goal.id} goalName={goal.name} />
        </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
