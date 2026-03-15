"use client"

import { useState, useCallback, type FormEvent } from "react"
import { Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AIEditBarProps {
  onSubmit: (command: string) => void
  isLoading: boolean
  placeholder?: string
}

export function AIEditBar({ onSubmit, isLoading, placeholder = "Ask AI to edit activities..." }: AIEditBarProps) {
  const [command, setCommand] = useState("")

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const trimmed = command.trim()
      if (!trimmed || isLoading) {
        return
      }
      onSubmit(trimmed)
      setCommand("")
    },
    [command, isLoading, onSubmit]
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-b px-4 py-2"
    >
      <Input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        disabled={isLoading || command.trim().length === 0}
        aria-label="Send AI command"
      >
        <Send className="size-4" />
      </Button>
    </form>
  )
}
