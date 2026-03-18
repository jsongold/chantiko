"use client"

import { useMemo, useState } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import type { View } from "react-big-calendar"
import {
  format,
  parse,
  startOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  getDay,
} from "date-fns"
import "react-big-calendar/lib/css/react-big-calendar.css"
import type { Task } from "@/types"
import type { ViewMode } from "./view-switcher"
import { expandTaskOccurrences } from "@/lib/rrule-utils"

const locales = { "en-US": {} }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Task
}

interface TaskCalendarProps {
  mode: Exclude<ViewMode, "list" | "year">
  tasks: Task[]
  onEventClick?: (task: Task) => void
}

const modeToView: Record<Exclude<ViewMode, "list" | "year">, View> = {
  day: Views.DAY,
  week: Views.WEEK,
  month: Views.MONTH,
}

function getViewRange(date: Date, mode: Exclude<ViewMode, "list" | "year">): [Date, Date] {
  if (mode === "day") return [startOfDay(date), endOfDay(date)]
  if (mode === "week") {
    const start = startOfWeek(date, { weekStartsOn: 0 })
    return [start, addDays(start, 6)]
  }
  return [startOfMonth(date), endOfMonth(date)]
}

export function TaskCalendar({ mode, tasks, onEventClick }: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const [rangeStart, rangeEnd] = useMemo(
    () => getViewRange(currentDate, mode),
    [currentDate, mode]
  )

  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = []
    for (const task of tasks) {
      const occurrences = expandTaskOccurrences(task, rangeStart, rangeEnd)
      occurrences.forEach(({ start, end }, i) => {
        result.push({
          id: `${task.id}-${i}`,
          title: task.name,
          start,
          end,
          resource: task,
        })
      })
    }
    return result
  }, [tasks, rangeStart, rangeEnd])

  const today = useMemo(() => new Date(), [])
  const scrollTime = useMemo(() => {
    const d = new Date()
    d.setHours(8, 0, 0, 0)
    return d
  }, [])

  return (
    <div className="task-calendar h-[calc(100vh-160px)]">
      <Calendar
        localizer={localizer}
        events={events}
        view={modeToView[mode]}
        onView={() => {}}
        date={currentDate}
        onNavigate={setCurrentDate}
        defaultDate={today}
        onSelectEvent={(event) => {
          onEventClick?.(event.resource)
        }}
        style={{ height: "100%" }}
        toolbar={false}
        scrollToTime={scrollTime}
      />
    </div>
  )
}
