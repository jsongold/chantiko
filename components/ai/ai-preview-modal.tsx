"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AIEditResponse, Operation } from "@/types"

interface AIPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: AIEditResponse | null
  onApply: () => void
  isApplying: boolean
}

function getOperationIndicator(op: Operation["op"]): {
  symbol: string
  label: string
  className: string
} {
  switch (op) {
    case "create":
      return {
        symbol: "+",
        label: "Create",
        className: "text-green-600 dark:text-green-400",
      }
    case "update":
      return {
        symbol: "~",
        label: "Update",
        className: "text-blue-600 dark:text-blue-400",
      }
    case "delete":
      return {
        symbol: "-",
        label: "Delete",
        className: "text-red-600 dark:text-red-400",
      }
  }
}

function formatOperationDetail(operation: Operation): string {
  if (operation.op === "delete") {
    return `Remove item ${operation.id ?? "unknown"}`
  }
  if (operation.data) {
    const title = operation.data.title
    if (typeof title === "string") {
      return title
    }
    return JSON.stringify(operation.data)
  }
  return operation.id ?? "unknown"
}

export function AIPreviewModal({
  open,
  onOpenChange,
  preview,
  onApply,
  isApplying,
}: AIPreviewModalProps) {
  if (!preview) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Edit Preview</DialogTitle>
          <DialogDescription>{preview.summary}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 py-2">
          {preview.operations.map((operation, index) => {
            const indicator = getOperationIndicator(operation.op)
            return (
              <div
                key={`${operation.op}-${operation.id ?? index}`}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <span
                  className={cn(
                    "font-mono text-base font-bold leading-5",
                    indicator.className
                  )}
                  aria-label={indicator.label}
                >
                  {indicator.symbol}
                </span>
                <span className="flex-1 text-muted-foreground">
                  {formatOperationDetail(operation)}
                </span>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button onClick={onApply} disabled={isApplying}>
            {isApplying ? "Applying..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
