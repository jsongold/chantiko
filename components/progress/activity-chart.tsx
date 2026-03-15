"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { format, parseISO } from "date-fns"
import type { Activity } from "@/types"

interface ActivityChartProps {
  activities: Activity[]
}

interface DayCount {
  date: string
  count: number
}

function groupActivitiesByDate(activities: Activity[]): DayCount[] {
  const countMap = activities.reduce<Record<string, number>>((acc, activity) => {
    const date = format(parseISO(activity.created_at), "yyyy-MM-dd")
    return {
      ...acc,
      [date]: (acc[date] ?? 0) + 1,
    }
  }, {})

  return Object.entries(countMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function formatDateLabel(dateStr: string): string {
  return format(parseISO(dateStr), "M/d")
}

export function ActivityChart({ activities }: ActivityChartProps) {
  const data = groupActivitiesByDate(activities)

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity data to display.
      </p>
    )
  }

  return (
    <div className="w-full">
      <h3 className="mb-2 text-sm font-medium">Activity per Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            className="text-xs"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            className="text-xs"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(label) =>
              typeof label === "string"
                ? format(parseISO(label), "MMM d, yyyy")
                : String(label)
            }
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
            }}
          />
          <Bar
            dataKey="count"
            name="Activities"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
