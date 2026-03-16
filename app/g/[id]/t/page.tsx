"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { TaskList } from "@/components/goals/task-list"
import { api } from "@/lib/api"
import type { Goal } from "@/types"

interface TasksPageProps {
  params: Promise<{ id: string }>
}

export default function TasksPage({ params }: TasksPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchGoal = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get<Goal>(`/goals/${id}`)
      if (response.success && response.data) {
        setGoal(response.data)
      } else {
        router.push("/g")
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  if (isLoading || !goal) {
    return (
      <AppShell>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading...
        </p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TaskList goalId={id} goalName={goal.name} />
    </AppShell>
  )
}
