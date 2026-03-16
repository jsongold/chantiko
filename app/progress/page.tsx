"use client"

import { useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ActivityChart } from "@/components/progress/activity-chart"
import { GoalProgressBar } from "@/components/progress/goal-progress-bar"
import { StreakBadge } from "@/components/progress/streak-badge"
import { useActivities } from "@/hooks/useActivities"
import { useGoals } from "@/hooks/useGoals"
import { Separator } from "@/components/ui/separator"
import { features } from "@/lib/features"

export default function ProgressPage() {
  const { activities, isLoading: activitiesLoading, fetchActivities } =
    useActivities()
  const { goals, isLoading: goalsLoading, fetchGoals } = useGoals()

  useEffect(() => {
    if (features.progress) {
      fetchActivities()
      fetchGoals()
    }
  }, [fetchActivities, fetchGoals])

  if (!features.progress) {
    return (
      <AppShell>
        <div className="p-4">
          <h2 className="text-lg font-semibold">Progress</h2>
          <p className="py-8 text-center text-sm text-muted-foreground">
            Coming soon
          </p>
        </div>
      </AppShell>
    )
  }

  const isLoading =
    (activitiesLoading && activities.length === 0) ||
    (goalsLoading && goals.length === 0)

  return (
    <AppShell>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Progress</h2>
          <StreakBadge activities={activities} />
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Your progress overview.
        </p>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : (
          <div className="space-y-6">
            <ActivityChart activities={activities} />
            <Separator />
            <GoalProgressBar goals={goals} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
