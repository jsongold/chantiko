"use client"

import { useState, useCallback } from "react"
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

const activityFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  value: z.string().min(1, "Value is required").max(100),
  value_unit: z.string().nullable(),
  category: z.string().min(1, "Category is required"),
})

export type ActivityFormData = z.infer<typeof activityFormSchema>

interface ActivityInputSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ActivityFormData) => void
  historyTitles: string[]
}

export function ActivityInputSheet({
  open,
  onOpenChange,
  onSubmit,
  historyTitles,
}: ActivityInputSheetProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [titleSearch, setTitleSearch] = useState("")

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
    },
  })

  const selectedUnit = watch("value_unit")
  const selectedCategory = watch("category")

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
          <SheetTitle>Log Activity</SheetTitle>
          <SheetDescription>Record what you did.</SheetDescription>
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

          <SheetFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save Activity"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
