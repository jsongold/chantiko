import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import type { GoalWithCounts } from "@/types"

interface GoalProgressBarProps {
  goals: GoalWithCounts[]
}

export function GoalProgressBar({ goals }: GoalProgressBarProps) {
  if (goals.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Goal Progress</h3>
      {goals.map((goal) => {
        const percentage =
          goal.task_count > 0
            ? Math.round((goal.done_count / goal.task_count) * 100)
            : 0

        return (
          <div key={goal.id} className="space-y-1">
            <Progress value={percentage}>
              <ProgressLabel>{goal.name}</ProgressLabel>
              <ProgressValue>
                {() => `${goal.done_count}/${goal.task_count}`}
              </ProgressValue>
            </Progress>
          </div>
        )
      })}
    </div>
  )
}
