"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { AllTaskList } from "@/components/tasks/all-task-list"
import { TaskCalendar } from "@/components/tasks/task-calendar"
import { TaskYearView } from "@/components/tasks/task-year-view"
import { ViewSwitcher, type ViewMode } from "@/components/tasks/view-switcher"
import { useAllTasks } from "@/hooks/useAllTasks"

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const { tasks, fetchTasks } = useAllTasks()

  // Fetch tasks when switching to calendar/year views
  // (list view handles its own fetch via AllTaskList)
  useEffect(() => {
    if (viewMode !== "list") {
      fetchTasks()
    }
  }, [viewMode, fetchTasks])

  return (
    <AppShell>
      {viewMode === "list" ? (
        <AllTaskList viewSwitcher={<ViewSwitcher mode={viewMode} onChange={setViewMode} />} />
      ) : (
        <div className="flex flex-col p-4 pb-20">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="mb-4 mt-1">
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
          </div>
          {(viewMode === "day" || viewMode === "week" || viewMode === "month") && (
            <TaskCalendar mode={viewMode} tasks={tasks} />
          )}
          {viewMode === "year" && (
            <TaskYearView
              tasks={tasks}
              onDayClick={(_, mode) => setViewMode(mode)}
            />
          )}
        </div>
      )}
    </AppShell>
  )
}
