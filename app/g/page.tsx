"use client"

import { AppShell } from "@/components/layout/app-shell"
import { GoalList } from "@/components/goals/goal-list"

export default function GoalsPage() {
  return (
    <AppShell>
      <GoalList />
    </AppShell>
  )
}
