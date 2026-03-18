import { RRule, Weekday } from "rrule"
import type { Task } from "@/types"

export interface CalendarEventResource {
  task: Task
  occurrenceStart: Date
}

/**
 * Given a task and a visible date range, returns all occurrences
 * that fall within [rangeStart, rangeEnd].
 *
 * - Non-recurring tasks with a scheduled_start_at produce one entry.
 * - Recurring tasks (with rrule) are expanded using the rrule library.
 */
export function expandTaskOccurrences(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date
): Array<{ start: Date; end: Date }> {
  if (!task.scheduled_start_at) return []

  const dtstart = new Date(task.scheduled_start_at)
  const duration = task.scheduled_end_at
    ? new Date(task.scheduled_end_at).getTime() - dtstart.getTime()
    : 30 * 60 * 1000 // default 30 min

  if (!task.rrule) {
    if (dtstart >= rangeStart && dtstart <= rangeEnd) {
      return [{ start: dtstart, end: new Date(dtstart.getTime() + duration) }]
    }
    return []
  }

  const rule = new RRule({
    ...RRule.parseString(task.rrule),
    dtstart,
  })

  return rule.between(rangeStart, rangeEnd, true).map((date) => ({
    start: date,
    end: new Date(date.getTime() + duration),
  }))
}

// ---------------------------------------------------------------------------
// Preset → RRULE string helpers
// ---------------------------------------------------------------------------

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekdays"
  | "weekly"
  | "monthly"
  | "custom"

export const WEEKDAY_OPTIONS: { label: string; short: string; day: Weekday }[] = [
  { label: "Sunday",    short: "S", day: RRule.SU },
  { label: "Monday",    short: "M", day: RRule.MO },
  { label: "Tuesday",   short: "T", day: RRule.TU },
  { label: "Wednesday", short: "W", day: RRule.WE },
  { label: "Thursday",  short: "T", day: RRule.TH },
  { label: "Friday",    short: "F", day: RRule.FR },
  { label: "Saturday",  short: "S", day: RRule.SA },
]

export function buildRRule(
  preset: RecurrencePreset,
  selectedDays: number[],  // indices into WEEKDAY_OPTIONS
  customText: string
): string | null {
  switch (preset) {
    case "none":
      return null
    case "daily":
      return new RRule({ freq: RRule.DAILY }).toString().replace("RRULE:", "")
    case "weekdays":
      return new RRule({
        freq: RRule.WEEKLY,
        byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
      })
        .toString()
        .replace("RRULE:", "")
    case "weekly": {
      const days =
        selectedDays.length > 0
          ? selectedDays.map((i) => WEEKDAY_OPTIONS[i].day)
          : [RRule.MO]
      return new RRule({ freq: RRule.WEEKLY, byweekday: days })
        .toString()
        .replace("RRULE:", "")
    }
    case "monthly":
      return new RRule({ freq: RRule.MONTHLY }).toString().replace("RRULE:", "")
    case "custom":
      return customText.trim() || null
  }
}

/**
 * Parse an existing RRULE string back into preset + selectedDays + customText.
 */
export function parseRRule(rrule: string | null): {
  preset: RecurrencePreset
  selectedDays: number[]
  customText: string
} {
  if (!rrule) return { preset: "none", selectedDays: [], customText: "" }

  try {
    const opts = RRule.parseString(rrule)
    const freq = opts.freq

    if (freq === RRule.DAILY && !opts.byweekday) {
      return { preset: "daily", selectedDays: [], customText: "" }
    }

    if (freq === RRule.MONTHLY) {
      return { preset: "monthly", selectedDays: [], customText: "" }
    }

    if (freq === RRule.WEEKLY && opts.byweekday) {
      const days = Array.isArray(opts.byweekday) ? opts.byweekday : [opts.byweekday]
      const dayNums = days.map((d) => {
        const n = typeof d === "number" ? d : (d as Weekday).weekday
        // RRule weekday: 0=MO … 6=SU; our array: 0=SU,1=MO…6=SA
        return (n + 1) % 7
      })

      const isWeekdays =
        dayNums.length === 5 &&
        [1, 2, 3, 4, 5].every((d) => dayNums.includes(d))

      if (isWeekdays) {
        return { preset: "weekdays", selectedDays: [], customText: "" }
      }

      return { preset: "weekly", selectedDays: dayNums, customText: "" }
    }
  } catch {
    // fall through to custom
  }

  return { preset: "custom", selectedDays: [], customText: rrule }
}
