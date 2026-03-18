"use client"

import { useCallback, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"
import { MessageList } from "@/components/ai/message-list"
import { useAIStore, type ChatMessage } from "@/store/aiStore"
import { useAIChat } from "@/hooks/useAIChat"
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight"
import { cn } from "@/lib/utils"

export interface AIChatSheetHandlers {
  onCreate?: (entity: string, data: Record<string, unknown>) => Promise<void>
  onUpdate?: (entity: string, id: string, data: Record<string, unknown>) => Promise<void>
  onDelete?: (entity: string, id: string) => Promise<void>
}

interface AIChatSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  handlers: AIChatSheetHandlers
  context?: Record<string, unknown>
}

export function AIChatSheet({
  open,
  onOpenChange,
  handlers,
  context = {},
}: AIChatSheetProps) {
  const { messages, isLoading, isSending, hasMore, isLoadingMore, replyTo } =
    useAIStore()
  const { setReplyTo } = useAIStore()
  const {
    fetchHistory,
    fetchOlderMessages,
    sendCommand,
    applyPending,
    cancelPending,
    pendingPreview,
  } = useAIChat(handlers)
  const { isKeyboardOpen } = useKeyboardHeight()

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, fetchHistory])

  const handleSend = useCallback(
    (command: string, replyToId?: string) => {
      sendCommand(command, context, replyToId)
    },
    [sendCommand, context]
  )

  const handleTapMessage = useCallback(
    (message: ChatMessage) => {
      setReplyTo(message)
    },
    [setReplyTo]
  )

  const handleCancelReply = useCallback(() => {
    setReplyTo(null)
  }, [setReplyTo])

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            "flex flex-col rounded-t-xl p-0",
            isKeyboardOpen ? "max-h-[90dvh]" : "max-h-[70dvh]"
          )}
        >
          <SheetHeader className="shrink-0 px-4 pt-4 pb-2">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>

          <MessageList
            messages={messages}
            isLoading={isLoading}
            isSending={isSending}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={fetchOlderMessages}
            onTapMessage={handleTapMessage}
          />

          <div className="shrink-0 border-t">
            <AIEditBar
              onSubmit={handleSend}
              isLoading={isSending}
              placeholder="Ask AI to log or edit activities..."
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AIPreviewModal
        open={pendingPreview !== null}
        onOpenChange={(open) => {
          if (!open) cancelPending()
        }}
        preview={pendingPreview?.preview ?? null}
        onApply={applyPending}
        isApplying={isSending}
      />
    </>
  )
}
