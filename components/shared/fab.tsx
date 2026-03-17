"use client"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FabProps {
  onClick: () => void
  icon: LucideIcon
  className?: string
  label?: string
}

export function Fab({ onClick, icon: Icon, className, label = "Action" }: FabProps) {
  return (
    <Button
      onClick={(e) => {
        onClick()
        e.currentTarget.blur()
      }}
      size="icon-lg"
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-40 rounded-full size-12 shadow-md",
        className
      )}
      aria-label={label}
    >
      <Icon className="size-5" />
    </Button>
  )
}
