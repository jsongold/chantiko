"use client"

import { useState, useCallback, type FormEvent } from "react"
import { Send, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { ChatMessage } from "@/store/aiStore"

interface AIEditBarProps {
  onSubmit: (command: string, replyToId?: string) => void
  isLoading: boolean
  placeholder?: string
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
}

export function AIEditBar({
  onSubmit,
  isLoading,
  placeholder = "Ask AI to edit activities...",
  replyTo,
  onCancelReply,
}: AIEditBarProps) {
  const [command, setCommand] = useState("")

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const trimmed = command.trim()
      if (!trimmed || isLoading) {
        return
      }
      onSubmit(trimmed, replyTo?.id)
      setCommand("")
    },
    [command, isLoading, onSubmit, replyTo]
  )

  return (
    <div>
      {replyTo && (
        <div className="flex items-center gap-2 border-b px-4 py-1.5 text-xs text-muted-foreground">
          <span className="min-w-0 flex-1 truncate">
            Replying to: {replyTo.content}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0"
            aria-label="Cancel reply"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
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
    </div>
  )
}
