"use client"

import { useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { MessageBubble } from "@/components/ai/message-bubble"
import type { ChatMessage } from "@/store/aiStore"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  onTapMessage?: (message: ChatMessage) => void
}

export function MessageList({
  messages,
  isLoading,
  isSending,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onTapMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isSending])

  useEffect(() => {
    const container = containerRef.current
    if (!container || prevScrollHeightRef.current === 0) return

    const newScrollHeight = container.scrollHeight
    const scrollDelta = newScrollHeight - prevScrollHeightRef.current
    if (scrollDelta > 0) {
      requestAnimationFrame(() => {
        container.scrollTop += scrollDelta
      })
    }
    prevScrollHeightRef.current = 0
  }, [messages])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || !hasMore || isLoadingMore) return

    if (container.scrollTop < 50) {
      prevScrollHeightRef.current = container.scrollHeight
      onLoadMore()
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="py-8 text-center text-sm text-muted-foreground">
          Tell me what you&apos;d like to log or change.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2"
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onTap={onTapMessage}
          />
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3 py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
