"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ActivityList } from "@/components/activity/activity-list"
import { AddActivityFab } from "@/components/activity/add-activity-fab"
import {
  ActivityInputSheet,
  type ActivityFormData,
} from "@/components/activity/activity-input-sheet"
import { AIEditBar } from "@/components/ai/ai-edit-bar"
import { AIPreviewModal } from "@/components/ai/ai-preview-modal"
import { useActivities } from "@/hooks/useActivities"
import { useAIEdit } from "@/hooks/useAIEdit"
import { useSettingsStore } from "@/store/settingsStore"

export default function ActivityPage() {
  const {
    activities,
    isLoading,
    hasMore,
    fetchActivities,
    createActivity,
    deleteActivity,
    fetchHistory,
  } = useActivities()

  const {
    isLoading: isAILoading,
    preview,
    submitCommand,
    applyOperations,
    clearPreview,
  } = useAIEdit()

  const { aiEnabled } = useSettingsStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [historyTitles, setHistoryTitles] = useState<string[]>([])
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  useEffect(() => {
    fetchHistory()
      .then(setHistoryTitles)
      .catch(() => {
        /* history fetch is non-critical */
      })
  }, [fetchHistory])

  const handleCreateActivity = useCallback(
    async (data: ActivityFormData) => {
      await createActivity(data)
      const titles = await fetchHistory().catch(() => [] as string[])
      setHistoryTitles(titles)
    },
    [createActivity, fetchHistory]
  )

  const handleAICommand = useCallback(
    (command: string) => {
      submitCommand(
        command,
        { activities: activities.slice(0, 20) },
        "activity_edit"
      )
    },
    [submitCommand, activities]
  )

  const handleApplyAI = useCallback(async () => {
    if (!preview) {
      return
    }

    setIsApplying(true)
    try {
      await applyOperations(preview.operations, {
        onCreate: async (data) => {
          await createActivity({
            title: String(data.title ?? ""),
            value: String(data.value ?? ""),
            value_unit: data.value_unit ? String(data.value_unit) : null,
            category: String(data.category ?? "Other"),
          })
        },
        onDelete: async (id) => {
          await deleteActivity(id)
        },
      })
      clearPreview()
    } finally {
      setIsApplying(false)
    }
  }, [preview, applyOperations, createActivity, deleteActivity, clearPreview])

  return (
    <AppShell>
      {aiEnabled && <AIEditBar onSubmit={handleAICommand} isLoading={isAILoading} />}

      <ActivityList
        activities={activities}
        onLoadMore={fetchActivities}
        hasMore={hasMore}
        isLoading={isLoading}
        onDelete={deleteActivity}
      />

      <AddActivityFab onClick={() => setSheetOpen(true)} />

      <ActivityInputSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleCreateActivity}
        historyTitles={historyTitles}
      />

      <AIPreviewModal
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            clearPreview()
          }
        }}
        preview={preview}
        onApply={handleApplyAI}
        isApplying={isApplying}
      />
    </AppShell>
  )
}
