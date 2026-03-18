"use client"

import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/store/aiStore"

interface MessageBubbleProps {
  message: ChatMessage
  onTap?: (message: ChatMessage) => void
}

export function MessageBubble({ message, onTap }: MessageBubbleProps) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <button
        type="button"
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm text-left",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
        onClick={() => onTap?.(message)}
      >
        {message.reply_to_content && (
          <div
            className={cn(
              "mb-1 truncate rounded-lg px-2 py-1 text-xs",
              isUser
                ? "bg-primary-foreground/15 text-primary-foreground/70"
                : "bg-background text-muted-foreground"
            )}
          >
            {message.reply_to_content}
          </div>
        )}
        <p>{message.content}</p>
        {message.status && (
          <p
            className={cn(
              "mt-1 text-xs",
              message.status === "applied"
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground line-through"
            )}
          >
            {message.status === "applied" ? "Applied" : "Cancelled"}
          </p>
        )}
      </button>
    </div>
  )
}
