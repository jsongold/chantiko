"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { VALUE_UNITS, ACTIVITY_CATEGORIES } from "@/types"
import type { Activity } from "@/types"
import { api } from "@/lib/api"
import type { Task } from "@/types"

export interface GoalOption {
  id: string
  name: string
}

const activityFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  value: z.string().min(1, "Value is required").max(100),
  value_unit: z.string().nullable(),
  category: z.string().min(1, "Category is required"),
  goal_id: z.string().nullable(),
  task_id: z.string().nullable(),
})

export type ActivityFormData = z.infer<typeof activityFormSchema>

interface ActivityInputSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ActivityFormData) => void
  historyTitles: string[]
  activity?: Activity | null
  goals?: GoalOption[]
}

export function ActivityInputSheet({
  open,
  onOpenChange,
  onSubmit,
  historyTitles,
  activity,
  goals = [],
}: ActivityInputSheetProps) {
  const isEditMode = activity !== null && activity !== undefined
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [titleSearch, setTitleSearch] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const prevGoalIdRef = useRef<string | null | undefined>(undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      value: "",
      value_unit: null,
      category: "Other",
      goal_id: null,
      task_id: null,
    },
  })

  useEffect(() => {
    if (activity) {
      reset({
        title: activity.title,
        value: activity.value,
        value_unit: activity.value_unit,
        category: activity.category,
        goal_id: activity.goal_id,
        task_id: activity.task_id,
      })
      setTitleSearch(activity.title)
    } else {
      reset({
        title: "",
        value: "",
        value_unit: null,
        category: "Other",
        goal_id: null,
        task_id: null,
      })
      setTitleSearch("")
    }
  }, [activity, reset])

  const selectedUnit = watch("value_unit")
  const selectedCategory = watch("category")
  const selectedGoalId = watch("goal_id")

  useEffect(() => {
    if (!open) {
      setTasks([])
      prevGoalIdRef.current = undefined
      return
    }
    if (selectedGoalId === prevGoalIdRef.current) return
    const prev = prevGoalIdRef.current
    prevGoalIdRef.current = selectedGoalId

    if (!selectedGoalId) {
      setTasks([])
      return
    }
    // Reset task when goal changes (not on initial load)
    if (prev !== undefined) {
      setValue("task_id", null)
    }
    api.get<Task[]>(`/tasks?goal_id=${selectedGoalId}`).then((res) => {
      if (res.success && res.data) {
        setTasks(res.data.filter((t) => t.status !== "archived" && !t.is_deleted))
      }
    }).catch(() => {})
  }, [selectedGoalId, open, setValue])

  const handleFormSubmit = useCallback(
    (data: ActivityFormData) => {
      onSubmit(data)
      reset()
      setTitleSearch("")
      setShowSuggestions(false)
      onOpenChange(false)
    },
    [onSubmit, reset, onOpenChange]
  )

  const handleTitleSelect = useCallback(
    (title: string) => {
      setValue("title", title, { shouldValidate: true })
      setTitleSearch(title)
      setShowSuggestions(false)
    },
    [setValue]
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset()
        setTitleSearch("")
        setShowSuggestions(false)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, reset]
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Activity" : "Log Activity"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update this activity." : "Record what you did."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-4 px-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-title">Title</Label>
            <div className="relative">
              <Command shouldFilter={true} className="rounded-lg border">
                <CommandInput
                  placeholder="What did you do?"
                  value={titleSearch}
                  onValueChange={(value) => {
                    setTitleSearch(value)
                    setValue("title", value, { shouldValidate: true })
                    setShowSuggestions(value.length > 0)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                />
                {showSuggestions && historyTitles.length > 0 && (
                  <CommandList>
                    <CommandEmpty>No matching history.</CommandEmpty>
                    <CommandGroup heading="Recent">
                      {historyTitles.map((title) => (
                        <CommandItem
                          key={title}
                          value={title}
                          onSelect={handleTitleSelect}
                        >
                          {title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="activity-value">Value</Label>
              <Input
                id="activity-value"
                placeholder="e.g. 30"
                {...register("value")}
              />
              {errors.value && (
                <p className="text-xs text-destructive">
                  {errors.value.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Unit</Label>
              <Select
                value={selectedUnit ?? ""}
                onValueChange={(value) =>
                  setValue("value_unit", value || null)
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {VALUE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) =>
                setValue("category", value ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          {goals.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Link to Goal (optional)</Label>
              <Select
                value={watch("goal_id") ?? ""}
                onValueChange={(value) =>
                  setValue("goal_id", value || null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedGoalId && tasks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Link to Task (optional)</Label>
              <Select
                value={watch("task_id") ?? ""}
                onValueChange={(value) =>
                  setValue("task_id", value || null)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update"
                  : "Save Activity"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
