"use client"

import { Plus } from "lucide-react"
import { Fab } from "@/components/shared/fab"

interface AddActivityFabProps {
  onClick: () => void
}

export function AddActivityFab({ onClick }: AddActivityFabProps) {
  return <Fab onClick={onClick} icon={Plus} label="Add activity" />
}
