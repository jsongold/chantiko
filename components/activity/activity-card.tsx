"use client"

import { formatDistanceToNow } from "date-fns"
import { Trash2, Target, ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Activity } from "@/types"

interface ActivityCardProps {
  activity: Activity
  onDelete?: (id: string) => void
  onTap?: (activity: Activity) => void
  goalName?: string | null
  taskName?: string | null
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

export function ActivityCard({ activity, onDelete, onTap, goalName, taskName }: ActivityCardProps) {
  const displayValue = formatValue(activity.value, activity.value_unit)
  const relativeTime = formatRelativeTime(activity.created_at)

  return (
    <div
      className="flex items-center gap-3 border-b px-4 py-3 cursor-pointer active:bg-muted/50"
      onClick={() => onTap?.(activity)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onTap?.(activity)
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-sm font-medium truncate shrink-0 max-w-[40%]">
            {activity.title || "Untitled"}
          </span>
          <Badge variant="secondary" className="shrink-0">
            {activity.category}
          </Badge>
          {goalName && (
            <Badge variant="outline" className="gap-1 truncate max-w-[8rem]">
              <Target className="size-2.5 shrink-0" />
              <span className="truncate">{goalName}</span>
            </Badge>
          )}
          {taskName && (
            <Badge variant="outline" className="gap-1 truncate max-w-[8rem]">
              <ListChecks className="size-2.5 shrink-0" />
              <span className="truncate">{taskName}</span>
            </Badge>
          )}
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
          onClick={(e) => { e.stopPropagation(); onDelete(activity.id) }}
          aria-label={`Delete ${activity.title}`}
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}
