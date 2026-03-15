"use client"

import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Activity } from "@/types"

interface ActivityCardProps {
  activity: Activity
  onDelete?: (id: string) => void
}

function formatValue(value: string, unit: string | null): string {
  if (!unit) {
    return value
  }
  return `${value} ${unit}`
}

function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  } catch {
    return ""
  }
}

export function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  const displayValue = formatValue(activity.value, activity.value_unit)
  const relativeTime = formatRelativeTime(activity.created_at)

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {activity.title}
          </span>
          <Badge variant="secondary" className="shrink-0">
            {activity.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {displayValue}
          </span>
          {relativeTime && (
            <>
              <span className="text-xs text-muted-foreground/50">
                ·
              </span>
              <span className="text-xs text-muted-foreground/70">
                {relativeTime}
              </span>
            </>
          )}
        </div>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(activity.id)}
          aria-label={`Delete ${activity.title}`}
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
