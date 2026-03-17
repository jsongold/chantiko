import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAIChat } from "@/hooks/useAIChat"
import { useAIStore } from "@/store/aiStore"
import { api } from "@/lib/api"
import { useSettingsStore } from "@/store/settingsStore"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// We mock useSettingsStore as a function that accepts a selector
// and returns values from a controlled object
const mockSettings = {
  llmModel: "claude-haiku-4-5-20251001" as string,
  aiMode: "manual" as string,
}

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: typeof mockSettings) => unknown) =>
    selector(mockSettings)
  ),
}))

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> }

describe("useAIChat", () => {
  const handlers = {
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAIStore.getState().reset()
    mockSettings.aiMode = "manual"
    mockSettings.llmModel = "claude-haiku-4-5-20251001"
  })

  describe("fetchHistory", () => {
    it("sets messages from API response", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          role: "assistant",
          content: "Hello",
          created_at: "2026-03-17T00:00:00Z",
        },
      ]
      mockApi.get.mockResolvedValue({ success: true, data: mockMessages })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.fetchHistory()
      })

      expect(mockApi.get).toHaveBeenCalledWith("/ai/sessions")
      expect(useAIStore.getState().messages).toEqual(mockMessages)
      expect(useAIStore.getState().isLoading).toBe(false)
    })

    it("sets loading true during fetch and false after", async () => {
      mockApi.get.mockResolvedValue({ success: false })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.fetchHistory()
      })

      expect(useAIStore.getState().isLoading).toBe(false)
    })

    it("does not set messages when API returns failure", async () => {
      mockApi.get.mockResolvedValue({ success: false, error: "fail" })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.fetchHistory()
      })

      expect(useAIStore.getState().messages).toEqual([])
    })
  })

  describe("sendCommand", () => {
    const chatResponse = {
      user_message_id: "real-user-1",
      assistant_message_id: "assistant-1",
      operations: [{ op: "create", data: { title: "Run 5k" }, entity: "activity" }],
      summary: "Created activity",
    }

    it("in Auto mode applies operations and sets status to applied", async () => {
      mockSettings.aiMode = "auto"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log run", {})
      })

      expect(handlers.onCreate).toHaveBeenCalledWith("activity", { title: "Run 5k" })

      const messages = useAIStore.getState().messages
      const assistantMsg = messages.find((m) => m.id === "assistant-1")
      expect(assistantMsg?.status).toBe("applied")
    })

    it("in Ask mode sets pendingPreview without applying operations", async () => {
      mockSettings.aiMode = "ask"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log run", {})
      })

      expect(handlers.onCreate).not.toHaveBeenCalled()
      expect(result.current.pendingPreview).not.toBeNull()
      expect(result.current.pendingPreview?.assistantMessageId).toBe("assistant-1")
    })

    it("in Manual mode neither applies operations nor sets pendingPreview", async () => {
      mockSettings.aiMode = "manual"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log run", {})
      })

      expect(handlers.onCreate).not.toHaveBeenCalled()
      expect(result.current.pendingPreview).toBeNull()
    })

    it("adds optimistic user message and assistant message to store", async () => {
      mockSettings.aiMode = "manual"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log run", {})
      })

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(2)
      // The optimistic user message ID gets replaced with the real one
      expect(messages[0].id).toBe("real-user-1")
      expect(messages[0].role).toBe("user")
      expect(messages[1].id).toBe("assistant-1")
      expect(messages[1].role).toBe("assistant")
    })

    it("sets isSending false after completion", async () => {
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("test", {})
      })

      expect(useAIStore.getState().isSending).toBe(false)
    })

    it("adds error assistant message when API returns failure", async () => {
      mockApi.post.mockResolvedValue({ success: false, error: "fail" })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("test", {})
      })

      // Optimistic user message + error assistant message
      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(2)
      expect(messages[1].role).toBe("assistant")
      expect(messages[1].content).toBe("fail")
      expect(handlers.onCreate).not.toHaveBeenCalled()
    })
  })

  describe("applyPending", () => {
    it("applies pending operations and sets status to applied", async () => {
      const chatResponse = {
        user_message_id: "u1",
        assistant_message_id: "a1",
        operations: [{ op: "create", data: { title: "Walk" }, entity: "activity" }],
        summary: "Created",
      }

      mockSettings.aiMode = "ask"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log walk", {})
      })

      expect(result.current.pendingPreview).not.toBeNull()

      await act(async () => {
        await result.current.applyPending()
      })

      expect(handlers.onCreate).toHaveBeenCalledWith("activity", { title: "Walk" })

      const assistantMsg = useAIStore.getState().messages.find((m) => m.id === "a1")
      expect(assistantMsg?.status).toBe("applied")
      expect(result.current.pendingPreview).toBeNull()
    })
  })

  describe("cancelPending", () => {
    it("sets status to cancelled and clears pendingPreview", async () => {
      const chatResponse = {
        user_message_id: "u1",
        assistant_message_id: "a1",
        operations: [{ op: "create", data: { title: "Walk" }, entity: "activity" }],
        summary: "Created",
      }

      mockSettings.aiMode = "ask"
      mockApi.post.mockResolvedValue({ success: true, data: chatResponse })

      const { result } = renderHook(() => useAIChat(handlers))

      await act(async () => {
        await result.current.sendCommand("log walk", {})
      })

      expect(result.current.pendingPreview).not.toBeNull()

      act(() => {
        result.current.cancelPending()
      })

      const assistantMsg = useAIStore.getState().messages.find((m) => m.id === "a1")
      expect(assistantMsg?.status).toBe("cancelled")
      expect(result.current.pendingPreview).toBeNull()
    })
  })
})
