"use client"

import { useEffect, useRef, useCallback, useMemo, useState } from "react"
import { isToday, isYesterday, format, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { ActivityCard } from "@/components/activity/activity-card"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ActivityInputSheet,
  type ActivityFormData,
} from "@/components/activity/activity-input-sheet"
import { AddActivityFab } from "@/components/activity/add-activity-fab"
import { AIEditSection } from "@/components/ai/ai-edit-section"
import { useActivities } from "@/hooks/useActivities"
import { useGoalStore } from "@/store/goalStore"
import { api } from "@/lib/api"
import type { Activity, GoalWithCounts } from "@/types"

function formatDateLabel(dateString: string): string {
  const date = parseISO(dateString)
  if (isToday(date)) {
    return "Today"
  }
  if (isYesterday(date)) {
    return "Yesterday"
  }
  return format(date, "MMM d")
}

function toDateKey(createdAt: string): string {
  return createdAt.slice(0, 10)
}

interface DateGroup {
  dateKey: string
  label: string
  activities: Activity[]
}

function groupActivitiesByDate(activities: Activity[]): DateGroup[] {
  const groups: DateGroup[] = []
  let currentKey = ""

  for (const activity of activities) {
    const key = toDateKey(activity.created_at)
    if (key !== currentKey) {
      currentKey = key
      groups.push({
        dateKey: key,
        label: formatDateLabel(activity.created_at),
        activities: [activity],
      })
    } else {
      groups[groups.length - 1].activities.push(activity)
    }
  }

  return groups
}

export function ActivityList() {
  const {
    activities,
    isLoading,
    hasMore,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    fetchHistory,
  } = useActivities()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [historyTitles, setHistoryTitles] = useState<string[]>([])
  const [goals, setGoals] = useState<GoalWithCounts[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    fetchHistory()
      .then(setHistoryTitles)
      .catch(() => {
        /* history fetch is non-critical */
      })
  }, [fetchHistory])

  useEffect(() => {
    api.get<GoalWithCounts[]>("/goals").then((res) => {
      if (res.success && res.data) {
        setGoals(res.data)
      }
    }).catch(() => {})
  }, [])

  const goalMap = useMemo(
    () => new Map(goals.map((g) => [g.id, g.name])),
    [goals]
  )

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        fetchActivities()
      }
    },
    [hasMore, isLoading, fetchActivities]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) {
      return
    }

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: "100px",
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection])

  const dateGroups = useMemo(
    () => groupActivitiesByDate(activities),
    [activities]
  )

  const handleCreateActivity = useCallback(
    async (data: ActivityFormData) => {
      await createActivity(data)
      const titles = await fetchHistory().catch(() => [] as string[])
      setHistoryTitles(titles)
    },
    [createActivity, fetchHistory]
  )

  const handleUpdateActivity = useCallback(
    async (data: ActivityFormData) => {
      if (!editingActivity) {
        return
      }
      await updateActivity(editingActivity.id, data)
      setEditingActivity(null)
    },
    [editingActivity, updateActivity]
  )

  const handleTapActivity = useCallback((activity: Activity) => {
    setEditingActivity(activity)
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingActivity(null)
    }
  }, [])

  const aiContextProvider = useCallback(
    () => ({ activities: activities.slice(0, 20) }),
    [activities]
  )

  const aiHandlers = useMemo(
    () => ({
      onCreate: async (data: Record<string, unknown>) => {
        await createActivity({
          title: String(data.title ?? ""),
          value: String(data.value ?? ""),
          value_unit: data.value_unit ? String(data.value_unit) : null,
          category: String(data.category ?? "Other"),
          goal_id: data.goal_id ? String(data.goal_id) : null,
          task_id: data.task_id ? String(data.task_id) : null,
        })
      },
      onDelete: async (id: string) => {
        await deleteActivity(id)
      },
    }),
    [createActivity, deleteActivity]
  )

  return (
    <>
      <AIEditSection
        contextProvider={aiContextProvider}
        endpoint="activity_edit"
        handlers={aiHandlers}
      />

      {!isLoading && activities.length === 0 ? (
        <EmptyState
          title="No activities yet"
          description="Tap the + button to log your first activity."
        />
      ) : (
        <div className="flex flex-col">
          {dateGroups.map((group) => (
            <div key={group.dateKey}>
              <p className="sticky top-0 z-10 bg-background px-4 py-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              {group.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onDelete={deleteActivity}
                  onTap={handleTapActivity}
                  goalName={activity.goal_id ? goalMap.get(activity.goal_id) ?? null : null}
                />
              ))}
            </div>
          ))}

          <div ref={sentinelRef} className="h-1" />

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <AddActivityFab onClick={() => {
        setEditingActivity(null)
        setSheetOpen(true)
      }} />

      <ActivityInputSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity}
        historyTitles={historyTitles}
        activity={editingActivity}
        goals={goals.map((g) => ({ id: g.id, name: g.name }))}
      />
    </>
  )
}
