"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { buildLayerTree } from "@/lib/utils"
import { GoalNode } from "@/components/goals/goal-node"
import { EmptyState } from "@/components/shared/empty-state"
import {
  AddLayerSheet,
  type AddLayerFormValues,
} from "@/components/goals/add-layer-sheet"
import { AIEditSection } from "@/components/ai/ai-edit-section"
import { RouteButton } from "@/components/shared/route-button"
import { useLayers } from "@/hooks/useLayers"
import type { Layer, LayerNode } from "@/types"

export function GoalTree() {
  const { layers, isLoading, fetchLayers, createLayer, updateLayer, deleteLayer } =
    useLayers()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingLayer, setEditingLayer] = useState<Layer | null>(null)

  useEffect(() => {
    fetchLayers()
  }, [fetchLayers])

  const tree = useMemo(() => buildLayerTree(layers), [layers])

  const handleToggleTask = useCallback(
    async (id: string, done: boolean) => {
      const newStatus: Layer["status"] = done ? "done" : "active"
      await updateLayer(id, { status: newStatus })
    },
    [updateLayer]
  )

  const handleAddLayer = useCallback(
    async (data: AddLayerFormValues) => {
      await createLayer({
        type: data.type,
        name: data.name,
        description: data.description,
        parent: data.parent,
        target_value: data.target_value,
        current_value: null,
        due_date: data.due_date ?? null,
        status: "active",
      })
    },
    [createLayer]
  )

  const handleUpdateLayer = useCallback(
    async (data: AddLayerFormValues) => {
      if (!editingLayer) {
        return
      }
      await updateLayer(editingLayer.id, {
        type: data.type,
        name: data.name,
        description: data.description,
        parent: data.parent,
        target_value: data.target_value,
        due_date: data.due_date ?? null,
      })
      setEditingLayer(null)
    },
    [editingLayer, updateLayer]
  )

  const handleTapLayer = useCallback((layer: LayerNode) => {
    setEditingLayer(layer)
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setEditingLayer(null)
    }
  }, [])

  const aiContextProvider = useCallback(
    () => ({ layers }),
    [layers]
  )

  const aiHandlers = useMemo(
    () => ({
      onCreate: async (opData: Record<string, unknown>) => {
        await createLayer(opData as Omit<Layer, "id" | "user_id" | "is_deleted" | "created_at" | "updated_at">)
      },
      onUpdate: async (id: string, opData: Record<string, unknown>) => {
        await updateLayer(id, opData as Partial<Layer>)
      },
      onDelete: async (id: string) => {
        await deleteLayer(id)
      },
    }),
    [createLayer, updateLayer, deleteLayer]
  )

  return (
    <>
      <AIEditSection
        contextProvider={aiContextProvider}
        endpoint="goal_edit"
        handlers={aiHandlers}
        placeholder="Ask AI to edit goals..."
      />

      <div className="p-4 pb-20">
        <h2 className="text-lg font-semibold">Goals</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Track your goals and tasks.
        </p>

        {isLoading && layers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : tree.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Tap the + button to create your first goal or task."
          />
        ) : (
          <div className="space-y-3">
            {tree.map((node) => (
              <GoalNode
                key={node.id}
                node={node}
                onToggleTask={handleToggleTask}
                onDelete={deleteLayer}
                onEdit={handleTapLayer}
              />
            ))}
          </div>
        )}
      </div>

      <RouteButton
        onClick={() => {
          setEditingLayer(null)
          setSheetOpen(true)
        }}
        aria-label="Add goal or task"
      />

      <AddLayerSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onSubmit={editingLayer ? handleUpdateLayer : handleAddLayer}
        existingLayers={layers}
        layer={editingLayer}
      />
    </>
  )
}
