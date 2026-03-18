"use client"

import { useMemo } from "react"
import {
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  isSameDay,
  format,
  getDay,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"
import type { ViewMode } from "./view-switcher"

interface TaskYearViewProps {
  tasks: Task[]
  onDayClick?: (date: Date, mode: ViewMode) => void
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

function MonthGrid({
  year,
  month,
  scheduledDays,
  onDayClick,
}: {
  year: number
  month: number
  scheduledDays: Set<string>
  onDayClick?: (date: Date) => void
}) {
  const firstDay = new Date(year, month, 1)
  const days = eachDayOfInterval({ start: startOfMonth(firstDay), end: endOfMonth(firstDay) })
  const startOffset = getDay(firstDay)

  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        {MONTH_NAMES[month]}
      </p>
      <div className="grid grid-cols-7 gap-px text-center">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd")
          const hasTask = scheduledDays.has(key)
          const isToday = isSameDay(day, new Date())
          return (
            <button
              key={key}
              onClick={() => onDayClick?.(day)}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] leading-none",
                isToday && "bg-primary text-primary-foreground font-bold",
                !isToday && "hover:bg-muted"
              )}
            >
              {day.getDate()}
              {hasTask && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TaskYearView({ tasks, onDayClick }: TaskYearViewProps) {
  const year = new Date().getFullYear()

  const scheduledDays = useMemo<Set<string>>(() => {
    const set = new Set<string>()
    for (const task of tasks) {
      if (task.scheduled_start_at) {
        set.add(format(new Date(task.scheduled_start_at), "yyyy-MM-dd"))
      }
    }
    return set
  }, [tasks])

  return (
    <div className="grid grid-cols-3 gap-4 px-1 pb-20 pt-2">
      {Array.from({ length: 12 }, (_, i) => (
        <MonthGrid
          key={i}
          year={year}
          month={i}
          scheduledDays={scheduledDays}
          onDayClick={(date) => onDayClick?.(date, "day")}
        />
      ))}
    </div>
  )
}
