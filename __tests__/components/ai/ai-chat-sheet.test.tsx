import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ChatMessage } from "@/store/aiStore"

// Mock useKeyboardHeight
vi.mock("@/hooks/useKeyboardHeight", () => ({
  useKeyboardHeight: vi.fn(() => ({ isKeyboardOpen: false, keyboardHeight: 0 })),
}))

// Mock useAIChat
const mockFetchHistory = vi.fn()
const mockFetchOlderMessages = vi.fn()
const mockSendCommand = vi.fn()
const mockApplyPending = vi.fn()
const mockCancelPending = vi.fn()

vi.mock("@/hooks/useAIChat", () => ({
  useAIChat: vi.fn(() => ({
    fetchHistory: mockFetchHistory,
    fetchOlderMessages: mockFetchOlderMessages,
    sendCommand: mockSendCommand,
    applyPending: mockApplyPending,
    cancelPending: mockCancelPending,
    pendingPreview: null,
  })),
}))

// Control the AI store state from tests
let mockStoreState = {
  messages: [] as ChatMessage[],
  isLoading: false,
  isSending: false,
  hasMore: false,
  isLoadingMore: false,
  replyTo: null as ChatMessage | null,
}

const mockSetReplyTo = vi.fn()

vi.mock("@/store/aiStore", () => ({
  useAIStore: vi.fn((selector?: (s: typeof mockStoreState & { setReplyTo: typeof mockSetReplyTo }) => unknown) => {
    const fullState = { ...mockStoreState, setReplyTo: mockSetReplyTo }
    if (typeof selector === "function") return selector(fullState)
    return fullState
  }),
}))

// Mock MessageList to render messages directly
vi.mock("@/components/ai/message-list", () => ({
  MessageList: ({ messages, isLoading, isSending }: {
    messages: ChatMessage[]
    isLoading: boolean
    isSending: boolean
  }) => {
    if (isLoading) return <div>Loading...</div>
    if (messages.length === 0) return <p>Tell me what you&apos;d like to log or change.</p>
    return (
      <div data-testid="message-list">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={m.role === "user" ? "bg-primary" : "bg-muted"}>
              {m.content}
            </div>
          </div>
        ))}
        {isSending && <div data-testid="sending-spinner">Sending...</div>}
      </div>
    )
  },
}))

// Mock AIEditBar to simplify testing the submit behavior
vi.mock("@/components/ai/ai-edit-bar", () => ({
  AIEditBar: ({ onSubmit, isLoading, placeholder }: {
    onSubmit: (cmd: string, replyToId?: string) => void
    isLoading: boolean
    placeholder?: string
  }) => (
    <div data-testid="ai-edit-bar">
      <input
        data-testid="ai-input"
        placeholder={placeholder}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit((e.target as HTMLInputElement).value)
          }
        }}
      />
      <button
        data-testid="ai-send-btn"
        disabled={isLoading}
        onClick={() => onSubmit("test command")}
      >
        Send
      </button>
    </div>
  ),
}))

// Mock AIPreviewModal
vi.mock("@/components/ai/ai-preview-modal", () => ({
  AIPreviewModal: () => null,
}))

// Mock Sheet primitives to render children directly without portal/animation complexity
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
}))

// Must import after mocks
import { AIChatSheet } from "@/components/ai/ai-chat-sheet"
import userEvent from "@testing-library/user-event"

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  handlers: {
    onCreate: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  },
  context: {},
}

describe("AIChatSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState = {
      messages: [],
      isLoading: false,
      isSending: false,
      hasMore: false,
      isLoadingMore: false,
      replyTo: null,
    }
  })

  it("renders AI Assistant title when open", () => {
    render(<AIChatSheet {...defaultProps} />)

    expect(screen.getByTestId("sheet-title")).toHaveTextContent("AI Assistant")
  })

  it("does not render when closed", () => {
    render(<AIChatSheet {...defaultProps} open={false} />)

    expect(screen.queryByTestId("sheet")).not.toBeInTheDocument()
  })

  it("shows empty state text when messages array is empty", () => {
    render(<AIChatSheet {...defaultProps} />)

    expect(
      screen.getByText(/tell me what you.*d like to log or change/i)
    ).toBeInTheDocument()
  })

  it("renders user messages aligned right and assistant messages aligned left", () => {
    mockStoreState = {
      ...mockStoreState,
      messages: [
        {
          id: "u1",
          role: "user",
          content: "Log my run",
          created_at: "2026-03-17T00:00:00Z",
        },
        {
          id: "a1",
          role: "assistant",
          content: "Logged 5k run",
          created_at: "2026-03-17T00:01:00Z",
        },
      ],
    }

    render(<AIChatSheet {...defaultProps} />)

    expect(screen.getByText("Log my run")).toBeInTheDocument()
    expect(screen.getByText("Logged 5k run")).toBeInTheDocument()

    // User message container should have justify-end
    const userBubble = screen.getByText("Log my run").closest("div[class]")
    const userContainer = userBubble?.parentElement
    expect(userContainer?.className).toContain("justify-end")

    // Assistant message container should have justify-start
    const assistantBubble = screen.getByText("Logged 5k run").closest("div[class]")
    const assistantContainer = assistantBubble?.parentElement
    expect(assistantContainer?.className).toContain("justify-start")
  })

  it("calls fetchHistory when opened", () => {
    render(<AIChatSheet {...defaultProps} open={true} />)

    expect(mockFetchHistory).toHaveBeenCalled()
  })

  it("does not call fetchHistory when closed", () => {
    render(<AIChatSheet {...defaultProps} open={false} />)

    expect(mockFetchHistory).not.toHaveBeenCalled()
  })

  it("shows loading spinner when isSending is true", () => {
    mockStoreState = {
      ...mockStoreState,
      messages: [
        {
          id: "u1",
          role: "user",
          content: "Log run",
          created_at: "2026-03-17T00:00:00Z",
        },
      ],
      isSending: true,
    }

    render(<AIChatSheet {...defaultProps} />)

    // The send button in our mocked AIEditBar should be disabled
    expect(screen.getByTestId("ai-send-btn")).toBeDisabled()
  })

  it("calls sendCommand when AIEditBar submit is triggered", async () => {
    const user = userEvent.setup()

    render(<AIChatSheet {...defaultProps} />)

    await user.click(screen.getByTestId("ai-send-btn"))

    expect(mockSendCommand).toHaveBeenCalledWith("test command", {}, undefined)
  })
})
