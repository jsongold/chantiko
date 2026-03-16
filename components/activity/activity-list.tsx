"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { isToday, isYesterday, format, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { ActivityCard } from "@/components/activity/activity-card"
import { EmptyState } from "@/components/shared/empty-state"
import type { Activity } from "@/types"

interface ActivityListProps {
  activities: Activity[]
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  onDelete: (id: string) => void
  onTap?: (activity: Activity) => void
}

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

export function ActivityList({
  activities,
  onLoadMore,
  hasMore,
  isLoading,
  onDelete,
  onTap,
}: ActivityListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [hasMore, isLoading, onLoadMore]
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

  if (!isLoading && activities.length === 0) {
    return (
      <EmptyState
        title="No activities yet"
        description="Tap the + button to log your first activity."
      />
    )
  }

  return (
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
              onDelete={onDelete}
              onTap={onTap}
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
  )
}
