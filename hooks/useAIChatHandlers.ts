import { useCallback } from "react"
import type { AIChatSheetHandlers } from "@/components/ai/ai-chat-sheet"

interface EntityCRUD {
  create: (data: Record<string, unknown>) => Promise<void>
  update: (id: string, data: Record<string, unknown>) => Promise<void>
  delete: (id: string) => Promise<void>
}

interface HandlerConfig {
  entityType: string
  crud: EntityCRUD
  mapCreate?: (data: Record<string, unknown>) => Record<string, unknown>
  mapUpdate?: (data: Record<string, unknown>) => Record<string, unknown>
}

export function useAIChatHandlers(config: HandlerConfig): AIChatSheetHandlers {
  const { entityType, crud, mapCreate, mapUpdate } = config

  const onCreate = useCallback(
    async (entity: string, data: Record<string, unknown>) => {
      if (entity === entityType) {
        const mapped = mapCreate ? mapCreate(data) : data
        await crud.create(mapped)
      }
    },
    [entityType, crud, mapCreate]
  )

  const onUpdate = useCallback(
    async (entity: string, id: string, data: Record<string, unknown>) => {
      if (entity === entityType) {
        const mapped = mapUpdate ? mapUpdate(data) : data
        await crud.update(id, mapped)
      }
    },
    [entityType, crud, mapUpdate]
  )

  const onDelete = useCallback(
    async (entity: string, id: string) => {
      if (entity === entityType) {
        await crud.delete(id)
      }
    },
    [entityType, crud]
  )

  return { onCreate, onUpdate, onDelete }
}
