import { Badge } from "@/components/ui/badge"
import { FlameIcon } from "lucide-react"
import { format, parseISO, subDays } from "date-fns"
import type { Activity } from "@/types"

interface StreakBadgeProps {
  activities: Activity[]
}

function computeStreak(activities: Activity[]): number {
  if (activities.length === 0) {
    return 0
  }

  const activityDates = new Set(
    activities.map((a) => format(parseISO(a.created_at), "yyyy-MM-dd"))
  )

  const today = new Date()
  let streak = 0
  let currentDate = today

  while (true) {
    const dateStr = format(currentDate, "yyyy-MM-dd")

    if (!activityDates.has(dateStr)) {
      break
    }

    streak = streak + 1
    currentDate = subDays(currentDate, 1)
  }

  return streak
}

export function StreakBadge({ activities }: StreakBadgeProps) {
  const streak = computeStreak(activities)

  if (streak === 0) {
    return (
      <Badge variant="secondary">
        <FlameIcon className="size-3" />
        No streak
      </Badge>
    )
  }

  return (
    <Badge variant="default">
      <FlameIcon className="size-3" />
      {streak} day{streak !== 1 ? "s" : ""}
    </Badge>
  )
}
