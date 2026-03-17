"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Sparkles, Loader2 } from "lucide-react"
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
import { features } from "@/lib/features"

export interface GoalOption {
  id: string
  name: string
}

export const activityFormSchema = z.object({
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
  const [aiSuggestion, setAISuggestion] = useState<{
    title: string
    value: string
    value_unit: string | null
    category: string
    goal_id: string | null
    task_id: string | null
  } | null>(null)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Debounced AI suggestion on title input (new activity mode only)
  useEffect(() => {
    if (!features.aiChat || isEditMode) return
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const trimmed = titleSearch.trim()
    if (trimmed.length < 3 || suggestionDismissed) {
      setAISuggestion(null)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      setSuggestionLoading(true)
      api
        .post<{
          title: string
          value: string
          value_unit: string | null
          category: string
          goal_id: string | null
          task_id: string | null
        }>("/ai/suggest-activity", {
          title_input: trimmed,
          context: {
            goals: goals.map((g) => ({ id: g.id, name: g.name })),
            tasks: tasks.map((t) => ({ id: t.id, name: t.name })),
          },
        })
        .then((res) => {
          if (res.success && res.data) {
            setAISuggestion(res.data)
          }
        })
        .catch(() => {})
        .finally(() => setSuggestionLoading(false))
    }, 1000)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [titleSearch, isEditMode, suggestionDismissed, goals])

  const handleFormSubmit = useCallback(
    (data: ActivityFormData) => {
      onSubmit(data)
      reset()
      setTitleSearch("")
      setShowSuggestions(false)
      setAISuggestion(null)
      setSuggestionDismissed(false)
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
        setAISuggestion(null)
        setSuggestionDismissed(false)
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
                    setSuggestionDismissed(false)
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

          {/* AI suggestion card */}
          {features.aiChat && !isEditMode && (
            <>
              {!suggestionLoading && !aiSuggestion && !suggestionDismissed && titleSearch.trim().length >= 3 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3 animate-pulse" />
                  AI thinking…
                </div>
              )}
              {suggestionLoading && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Generating suggestion…
                </div>
              )}
              {aiSuggestion && !suggestionLoading && (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    AI suggests
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {aiSuggestion.value && (
                      <span className="rounded bg-background px-1.5 py-0.5 border">
                        Value: {aiSuggestion.value}
                      </span>
                    )}
                    {aiSuggestion.value_unit && (
                      <span className="rounded bg-background px-1.5 py-0.5 border">
                        Unit: {aiSuggestion.value_unit}
                      </span>
                    )}
                    {aiSuggestion.category && (
                      <span className="rounded bg-background px-1.5 py-0.5 border">
                        Category: {aiSuggestion.category}
                      </span>
                    )}
                    {aiSuggestion.goal_id &&
                      goals.find((g) => g.id === aiSuggestion.goal_id) && (
                        <span className="rounded bg-background px-1.5 py-0.5 border">
                          Goal:{" "}
                          {goals.find((g) => g.id === aiSuggestion.goal_id)?.name}
                        </span>
                      )}
                    {aiSuggestion.task_id &&
                      tasks.find((t) => t.id === aiSuggestion.task_id) && (
                        <span className="rounded bg-background px-1.5 py-0.5 border">
                          Task:{" "}
                          {tasks.find((t) => t.id === aiSuggestion.task_id)?.name}
                        </span>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        const s = aiSuggestion
                        if (s.value) setValue("value", s.value, { shouldValidate: true })
                        if (s.value_unit) setValue("value_unit", s.value_unit)
                        if (s.category) setValue("category", s.category, { shouldValidate: true })
                        if (s.goal_id) setValue("goal_id", s.goal_id)
                        if (s.task_id) setValue("task_id", s.task_id)
                        setAISuggestion(null)
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setAISuggestion(null)
                        setSuggestionDismissed(true)
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

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
                  <span className="truncate">
                    {goals.find((g) => g.id === watch("goal_id"))?.name ?? "No goal"}
                  </span>
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
                  <span className="truncate">
                    {tasks.find((t) => t.id === watch("task_id"))?.name ?? "No task"}
                  </span>
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
