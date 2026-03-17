"use client"

import { AppShell } from "@/components/layout/app-shell"
import { AllTaskList } from "@/components/tasks/all-task-list"

export default function TasksPage() {
  return (
    <AppShell>
      <AllTaskList />
    </AppShell>
  )
}
