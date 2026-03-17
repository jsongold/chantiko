"use client"

import { useEffect, useRef, useCallback, useMemo, useState } from "react"
import { isToday, isYesterday, format, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { ActivityCard } from "@/components/activity/activity-card"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ActivityInputSheet,
  type ActivityFormData,
  activityFormSchema,
} from "@/components/activity/activity-input-sheet"
import { ChikoFab } from "@/components/shared/chiko-fab"
import { AIChatSheet } from "@/components/ai/ai-chat-sheet"
import { useActivities } from "@/hooks/useActivities"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { api } from "@/lib/api"
import type { Activity, GoalWithCounts, Task } from "@/types"
import { features } from "@/lib/features"

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
  const [aiChatOpen, setAIChatOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null)
  const [historyTitles, setHistoryTitles] = useState<string[]>([])
  const [goals, setGoals] = useState<GoalWithCounts[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
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
    api.get<Task[]>("/tasks").then((res) => {
      if (res.success && res.data) {
        setTasks(res.data)
      }
    }).catch(() => {})
  }, [])

  const goalMap = useMemo(
    () => new Map(goals.map((g) => [g.id, g.name])),
    [goals]
  )

  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t.name])),
    [tasks]
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

  return (
    <>
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
                  onDelete={(id) => setDeletingActivityId(id)}
                  onTap={handleTapActivity}
                  goalName={activity.goal_id ? goalMap.get(activity.goal_id) ?? null : null}
                  taskName={activity.task_id ? taskMap.get(activity.task_id) ?? null : null}
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

      <ChikoFab
        onManualOpen={() => {
          setEditingActivity(null)
          setSheetOpen(true)
        }}
        onAIOpen={() => setAIChatOpen(true)}
      />

      <ActivityInputSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity}
        historyTitles={historyTitles}
        activity={editingActivity}
        goals={goals.map((g) => ({ id: g.id, name: g.name }))}
      />

      <AlertDialog
        open={deletingActivityId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingActivityId(null)
        }}
        title="Delete activity?"
        description="This action cannot be undone."
        onConfirm={() => {
          if (deletingActivityId) {
            deleteActivity(deletingActivityId)
            setDeletingActivityId(null)
          }
        }}
      />

      {features.aiChat && (
        <AIChatSheet
          open={aiChatOpen}
          onOpenChange={setAIChatOpen}
          handlers={{
            onCreate: async (entity, data) => {
              if (entity === "activity") {
                const parsed = activityFormSchema.safeParse({
                  task_id: null,
                  goal_id: null,
                  ...data,
                  title: String(data.title || data.name || ""),
                })
                if (parsed.success) await createActivity(parsed.data)
              }
            },
            onUpdate: async (entity, id, data) => {
              if (entity === "activity") {
                const parsed = activityFormSchema.safeParse({
                  task_id: null,
                  goal_id: null,
                  ...data,
                  title: String(data.title || data.name || ""),
                })
                if (parsed.success) await updateActivity(id, parsed.data)
              }
            },
            onDelete: async (entity, id) => {
              if (entity === "activity") {
                await deleteActivity(id)
              }
            },
          }}
          context={{
            page: "activities",
            recent_activities: activities.slice(0, 10).map((a) => ({
              id: a.id,
              title: a.title,
              value: a.value,
              value_unit: a.value_unit,
              category: a.category,
            })),
            goals: goals.map((g) => ({ id: g.id, name: g.name })),
          }}
        />
      )}
    </>
  )
}
