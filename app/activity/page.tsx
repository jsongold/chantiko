"use client"

import { AppShell } from "@/components/layout/app-shell"
import { ActivityList } from "@/components/activity/activity-list"

export default function ActivityPage() {
  return (
    <AppShell>
      <ActivityList />
    </AppShell>
  )
}
