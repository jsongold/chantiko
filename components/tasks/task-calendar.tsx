"use client"

import { useMemo } from "react"
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import type { View } from "react-big-calendar"
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from "date-fns"
import "react-big-calendar/lib/css/react-big-calendar.css"
import type { Task } from "@/types"
import type { ViewMode } from "./view-switcher"

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

export function TaskCalendar({ mode, tasks, onEventClick }: TaskCalendarProps) {
  const events = useMemo<CalendarEvent[]>(() => {
    return tasks
      .filter((t) => t.scheduled_start_at !== null)
      .map((t) => ({
        id: t.id,
        title: t.name,
        start: new Date(t.scheduled_start_at!),
        end: t.scheduled_end_at
          ? new Date(t.scheduled_end_at)
          : new Date(new Date(t.scheduled_start_at!).getTime() + 30 * 60 * 1000),
        resource: t,
      }))
  }, [tasks])

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
