import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Layer, LayerNode } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildLayerTree(layers: Layer[]): LayerNode[] {
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
