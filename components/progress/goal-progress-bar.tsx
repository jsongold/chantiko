import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import type { Layer } from "@/types"

interface GoalProgressBarProps {
  layers: Layer[]
}

interface GoalProgress {
  id: string
  name: string
  completed: number
  total: number
}

function computeGoalProgress(layers: Layer[]): GoalProgress[] {
  const goals = layers.filter((l) => l.type === "goal")
  const tasks = layers.filter((l) => l.type === "task")

  return goals.map((goal) => {
    const childTasks = tasks.filter((t) => t.parent === goal.id)
    const completed = childTasks.filter((t) => t.status === "done").length

    return {
      id: goal.id,
      name: goal.name,
      completed,
      total: childTasks.length,
    }
  })
}

export function GoalProgressBar({ layers }: GoalProgressBarProps) {
  const goalProgressList = computeGoalProgress(layers)

  if (goalProgressList.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Goal Progress</h3>
      {goalProgressList.map((goal) => {
        const percentage =
          goal.total > 0
            ? Math.round((goal.completed / goal.total) * 100)
            : 0

        return (
          <div key={goal.id} className="space-y-1">
            <Progress value={percentage}>
              <ProgressLabel>{goal.name}</ProgressLabel>
              <ProgressValue>
                {() => `${goal.completed}/${goal.total}`}
              </ProgressValue>
            </Progress>
          </div>
        )
      })}
    </div>
  )
}
