"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"

interface RouteButtonProps {
  onClick: () => void
  "aria-label": string
}

export function RouteButton({ onClick, "aria-label": ariaLabel }: RouteButtonProps) {
  return (
    <Button
      size="icon"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 size-12 rounded-full shadow-lg"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <PlusIcon className="size-5" />
    </Button>
  )
}
