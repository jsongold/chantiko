import { create } from "zustand"
import type { Layer } from "@/types"

interface LayerState {
  layers: Layer[]
  isLoading: boolean
}

interface LayerActions {
  setLayers: (layers: Layer[]) => void
  addLayer: (layer: Layer) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  removeLayer: (id: string) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

const initialState: LayerState = {
  layers: [],
  isLoading: false,
}

export const useLayerStore = create<LayerState & LayerActions>((set) => ({
  ...initialState,

  setLayers: (layers) => set({ layers: [...layers] }),

  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
    })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({ ...initialState }),
}))
