import { describe, it, expect, beforeEach } from "vitest"
import { useAIStore, type ChatMessage } from "@/store/aiStore"

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    role: "user",
    content: "hello",
    created_at: "2026-03-17T00:00:00Z",
    ...overrides,
  }
}

describe("aiStore", () => {
  beforeEach(() => {
    useAIStore.getState().reset()
  })

  it("starts with empty initial state", () => {
    const state = useAIStore.getState()
    expect(state.messages).toEqual([])
    expect(state.isLoading).toBe(false)
    expect(state.isSending).toBe(false)
  })

  describe("setMessages", () => {
    it("replaces the messages array", () => {
      const msgs = [makeMessage({ id: "a" }), makeMessage({ id: "b" })]
      useAIStore.getState().setMessages(msgs)

      expect(useAIStore.getState().messages).toEqual(msgs)
    })

    it("replaces previous messages entirely", () => {
      useAIStore.getState().setMessages([makeMessage({ id: "old" })])
      useAIStore.getState().setMessages([makeMessage({ id: "new" })])

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].id).toBe("new")
    })
  })

  describe("addMessage", () => {
    it("appends a message to the existing array", () => {
      useAIStore.getState().setMessages([makeMessage({ id: "first" })])
      useAIStore.getState().addMessage(makeMessage({ id: "second" }))

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(2)
      expect(messages[0].id).toBe("first")
      expect(messages[1].id).toBe("second")
    })

    it("appends to an empty array", () => {
      useAIStore.getState().addMessage(makeMessage({ id: "only" }))

      expect(useAIStore.getState().messages).toHaveLength(1)
    })
  })

  describe("updateMessageStatus", () => {
    it("updates only the matching message status", () => {
      useAIStore.getState().setMessages([
        makeMessage({ id: "a", role: "assistant" }),
        makeMessage({ id: "b", role: "assistant" }),
      ])

      useAIStore.getState().updateMessageStatus("a", "applied")

      const messages = useAIStore.getState().messages
      expect(messages[0].status).toBe("applied")
      expect(messages[1].status).toBeUndefined()
    })

    it("sets status to cancelled", () => {
      useAIStore.getState().setMessages([
        makeMessage({ id: "x", role: "assistant" }),
      ])

      useAIStore.getState().updateMessageStatus("x", "cancelled")

      expect(useAIStore.getState().messages[0].status).toBe("cancelled")
    })

    it("does nothing when id does not match any message", () => {
      const original = [makeMessage({ id: "a" })]
      useAIStore.getState().setMessages(original)

      useAIStore.getState().updateMessageStatus("nonexistent", "applied")

      const messages = useAIStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].status).toBeUndefined()
    })
  })

  describe("setLoading", () => {
    it("updates isLoading to true", () => {
      useAIStore.getState().setLoading(true)
      expect(useAIStore.getState().isLoading).toBe(true)
    })

    it("updates isLoading to false", () => {
      useAIStore.getState().setLoading(true)
      useAIStore.getState().setLoading(false)
      expect(useAIStore.getState().isLoading).toBe(false)
    })
  })

  describe("setSending", () => {
    it("updates isSending to true", () => {
      useAIStore.getState().setSending(true)
      expect(useAIStore.getState().isSending).toBe(true)
    })

    it("updates isSending to false", () => {
      useAIStore.getState().setSending(true)
      useAIStore.getState().setSending(false)
      expect(useAIStore.getState().isSending).toBe(false)
    })
  })

  describe("reset", () => {
    it("restores initial state", () => {
      useAIStore.getState().setMessages([makeMessage()])
      useAIStore.getState().setLoading(true)
      useAIStore.getState().setSending(true)

      useAIStore.getState().reset()

      const state = useAIStore.getState()
      expect(state.messages).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.isSending).toBe(false)
    })
  })
})
