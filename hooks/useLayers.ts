"use client"

import { useCallback } from "react"
import { api } from "@/lib/api"
import { useLayerStore } from "@/store/layerStore"
import type { Layer } from "@/types"

export function useLayers() {
  const {
    layers,
    isLoading,
    setLayers,
    addLayer,
    updateLayer,
    removeLayer,
    setLoading,
  } = useLayerStore()

  const fetchLayers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<Layer[]>("/layers")

      if (response.success && response.data) {
        setLayers(response.data)
      }
    } finally {
      setLoading(false)
    }
  }, [setLoading, setLayers])

  const createLayer = useCallback(
    async (data: Omit<Layer, "id" | "user_id" | "is_deleted" | "created_at" | "updated_at">) => {
      const response = await api.post<Layer>("/layers", data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to create layer")
      }

      addLayer(response.data)
      return response.data
    },
    [addLayer]
  )

  const handleUpdateLayer = useCallback(
    async (id: string, data: Partial<Layer>) => {
      const response = await api.patch<Layer>(`/layers/${id}`, data)

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update layer")
      }

      updateLayer(id, response.data)
      return response.data
    },
    [updateLayer]
  )

  const deleteLayer = useCallback(
    async (id: string) => {
      const response = await api.delete(`/layers/${id}`)

      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete layer")
      }

      removeLayer(id)
    },
    [removeLayer]
  )

  return {
    layers,
    isLoading,
    fetchLayers,
    createLayer,
    updateLayer: handleUpdateLayer,
    deleteLayer,
  }
}
