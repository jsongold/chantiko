import { describe, it, expect, beforeEach } from "vitest"
import { useSettingsStore } from "@/store/settingsStore"

describe("settingsStore", () => {
  beforeEach(() => {
    // Reset to defaults by calling each setter
    useSettingsStore.getState().setAIMode("ask")
    useSettingsStore.getState().setAIEnabled(true)
    useSettingsStore.getState().setLLMModel("gpt-4o-mini")
  })

  describe("aiMode", () => {
    it("defaults to ask", () => {
      expect(useSettingsStore.getState().aiMode).toBe("ask")
    })

    it("setAIMode updates to auto", () => {
      useSettingsStore.getState().setAIMode("auto")
      expect(useSettingsStore.getState().aiMode).toBe("auto")
    })

    it("setAIMode updates to ask", () => {
      useSettingsStore.getState().setAIMode("ask")
      expect(useSettingsStore.getState().aiMode).toBe("ask")
    })

    it("setAIMode updates to manual", () => {
      useSettingsStore.getState().setAIMode("auto")
      useSettingsStore.getState().setAIMode("manual")
      expect(useSettingsStore.getState().aiMode).toBe("manual")
    })
  })

  describe("aiEnabled", () => {
    it("defaults to true", () => {
      expect(useSettingsStore.getState().aiEnabled).toBe(true)
    })

    it("setAIEnabled toggles value", () => {
      useSettingsStore.getState().setAIEnabled(false)
      expect(useSettingsStore.getState().aiEnabled).toBe(false)
    })
  })

  describe("llmModel", () => {
    it("defaults to gpt-4o-mini", () => {
      expect(useSettingsStore.getState().llmModel).toBe("gpt-4o-mini")
    })

    it("setLLMModel updates the model", () => {
      useSettingsStore.getState().setLLMModel("gpt-4o")
      expect(useSettingsStore.getState().llmModel).toBe("gpt-4o")
    })
  })
})
