"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  buildRRule,
  parseRRule,
  WEEKDAY_OPTIONS,
  type RecurrencePreset,
} from "@/lib/rrule-utils"

interface RecurrencePickerProps {
  value: string | null
  onChange: (rrule: string | null) => void
}

const PRESET_LABELS: Record<RecurrencePreset, string> = {
  none: "Does not repeat",
  daily: "Every day",
  weekdays: "Every weekday (Mon–Fri)",
  weekly: "Every week on…",
  monthly: "Every month",
  custom: "Custom (RRULE)",
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const parsed = parseRRule(value)
  const [preset, setPreset] = useState<RecurrencePreset>(parsed.preset)
  const [selectedDays, setSelectedDays] = useState<number[]>(parsed.selectedDays)
  const [customText, setCustomText] = useState(parsed.customText)

  const emit = (
    nextPreset: RecurrencePreset,
    nextDays: number[],
    nextCustom: string
  ) => {
    onChange(buildRRule(nextPreset, nextDays, nextCustom))
  }

  const handlePresetChange = (p: RecurrencePreset) => {
    setPreset(p)
    emit(p, selectedDays, customText)
  }

  const toggleDay = (idx: number) => {
    const next = selectedDays.includes(idx)
      ? selectedDays.filter((d) => d !== idx)
      : [...selectedDays, idx]
    setSelectedDays(next)
    emit(preset, next, customText)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Repeat</Label>
        <Select
          value={preset}
          onValueChange={(v) => handlePresetChange(v as RecurrencePreset)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PRESET_LABELS) as RecurrencePreset[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PRESET_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === "weekly" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">On these days</Label>
          <div className="flex gap-1">
            {WEEKDAY_OPTIONS.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  selectedDays.includes(idx)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                aria-label={opt.label}
                aria-pressed={selectedDays.includes(idx)}
              >
                {opt.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {preset === "custom" && (
        <div className="space-y-1.5">
          <Label htmlFor="rrule-custom" className="text-xs text-muted-foreground">
            RRULE string
          </Label>
          <Input
            id="rrule-custom"
            placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value)
              emit(preset, selectedDays, e.target.value)
            }}
          />
        </div>
      )}
    </div>
  )
}
