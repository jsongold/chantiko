"use client"

import { useCallback, useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"
import { useAIStore, type ChatMessage } from "@/store/aiStore"
import { useAIChat } from "@/hooks/useAIChat"
import { cn } from "@/lib/utils"

interface AIChatSheetHandlers {
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

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
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
      </div>
    </div>
  )
}

export function AIChatSheet({
  open,
  onOpenChange,
  handlers,
  context = {},
}: AIChatSheetProps) {
  const { messages, isLoading, isSending } = useAIStore()
  const { fetchHistory, sendCommand, applyPending, cancelPending, pendingPreview } =
    useAIChat(handlers)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open, fetchHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(
    (command: string) => {
      sendCommand(command, context)
    },
    [sendCommand, context]
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-[70vh] flex-col rounded-t-xl p-0">
          <SheetHeader className="shrink-0 px-4 pt-4 pb-2">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tell me what you&apos;d like to log or change.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
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
            )}
          </div>

          <div className="shrink-0 border-t">
            <AIEditBar
              onSubmit={handleSend}
              isLoading={isSending}
              placeholder="Ask AI to log or edit activities..."
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
