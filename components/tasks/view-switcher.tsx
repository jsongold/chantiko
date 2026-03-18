"use client"

import { List, CalendarDays, CalendarRange, CalendarCheck, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ViewMode = "list" | "day" | "week" | "month" | "year"

interface ViewSwitcherProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

const views: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "list", icon: <List className="h-4 w-4" />, label: "List" },
  { mode: "day", icon: <CalendarDays className="h-4 w-4" />, label: "Today" },
  { mode: "week", icon: <CalendarRange className="h-4 w-4" />, label: "Week" },
  { mode: "month", icon: <CalendarCheck className="h-4 w-4" />, label: "Month" },
  { mode: "year", icon: <LayoutGrid className="h-4 w-4" />, label: "Year" },
]

export function ViewSwitcher({ mode, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex gap-1">
      {views.map((v) => (
        <Button
          key={v.mode}
          variant={mode === v.mode ? "default" : "ghost"}
          size="icon"
          aria-label={v.label}
          onClick={() => onChange(v.mode)}
        >
          {v.icon}
        </Button>
      ))}
    </div>
  )
}
