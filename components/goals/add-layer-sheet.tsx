"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Layer } from "@/types"

const addLayerSchema = z.object({
  type: z.enum(["goal", "task"]),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500),
  parent: z.string().nullable(),
  target_value: z.string().nullable(),
  due_date: z.string().nullable(),
})

type AddLayerFormValues = z.infer<typeof addLayerSchema>

interface AddLayerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddLayerFormValues) => void
  existingLayers: Layer[]
  layer?: Layer | null
}

export type { AddLayerFormValues }

export function AddLayerSheet({
  open,
  onOpenChange,
  onSubmit,
  existingLayers,
  layer,
}: AddLayerSheetProps) {
  const isEditMode = layer !== null && layer !== undefined
  const goalLayers = existingLayers.filter((l) => l.type === "goal")

  const form = useForm<AddLayerFormValues>({
    resolver: zodResolver(addLayerSchema),
    defaultValues: {
      type: "goal",
      name: "",
      description: "",
      parent: null,
      target_value: null,
      due_date: null,
    },
  })

  useEffect(() => {
    if (layer) {
      form.reset({
        type: layer.type,
        name: layer.name,
        description: layer.description ?? "",
        parent: layer.parent,
        target_value: layer.target_value,
        due_date: layer.due_date ?? null,
      })
    } else {
      form.reset({
        type: "goal",
        name: "",
        description: "",
        parent: null,
        target_value: null,
        due_date: null,
      })
    }
  }, [layer, form])

  const handleSubmit = (values: AddLayerFormValues) => {
    onSubmit(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Goal or Task" : "Add Goal or Task"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update this goal or task."
              : "Create a new goal to track or a task to complete."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4 px-4"
        >
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="goal" />
                    <Label className="font-normal">Goal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="task" />
                    <Label className="font-normal">Task</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="layer-name">Name</Label>
            <Input
              id="layer-name"
              placeholder="Enter name..."
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
            <Label htmlFor="layer-description">Description</Label>
            <Textarea
              id="layer-description"
              placeholder="Optional description..."
              {...form.register("description")}
            />
          </div>

          {goalLayers.length > 0 ? (
            <div className="space-y-2">
              <Label>Parent Goal (optional)</Label>
              <Controller
                control={form.control}
                name="parent"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => {
                      field.onChange(val === "" ? null : val)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent</SelectItem>
                      {goalLayers.map((layer) => (
                        <SelectItem key={layer.id} value={layer.id}>
                          {layer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="layer-target">Target Value (optional)</Label>
            <Input
              id="layer-target"
              placeholder="e.g. 10 books, 5km..."
              {...form.register("target_value")}
            />
          </div>

          {form.watch("type") === "goal" ? (
            <div className="space-y-2">
              <Label htmlFor="layer-due-date">Due Date (optional)</Label>
              <Input
                id="layer-due-date"
                type="date"
                {...form.register("due_date")}
              />
            </div>
          ) : null}

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
