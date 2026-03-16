"use client"

import { GoalNode } from "@/components/goals/goal-node"
import { EmptyState } from "@/components/shared/empty-state"
import type { Layer, LayerNode } from "@/types"

function buildLayerTree(layers: Layer[]): LayerNode[] {
  const nodeMap = new Map<string, LayerNode>()
  const roots: LayerNode[] = []

  for (const layer of layers) {
    nodeMap.set(layer.name, { ...layer, children: [] })
  }

  for (const layer of layers) {
    const node = nodeMap.get(layer.name)!
    if (layer.parent && nodeMap.has(layer.parent)) {
      nodeMap.get(layer.parent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

interface GoalTreeProps {
  layers: Layer[]
  onToggleTask: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit?: (layer: LayerNode) => void
}

export function GoalTree({ layers, onToggleTask, onDelete, onEdit }: GoalTreeProps) {
  const tree = buildLayerTree(layers)

  if (tree.length === 0) {
    return (
      <EmptyState
        title="No goals yet"
        description="Tap the + button to create your first goal or task."
      />
    )
  }

  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <GoalNode
          key={node.id}
          node={node}
          onToggleTask={onToggleTask}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
