"use client"

import { useEffect, useRef, useCallback } from "react"
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
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onDelete={onDelete}
          onTap={onTap}
        />
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
