import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ChatMessage } from "@/store/aiStore"

// Mock useAIChat
const mockFetchHistory = vi.fn()
const mockSendCommand = vi.fn()
const mockApplyPending = vi.fn()
const mockCancelPending = vi.fn()

vi.mock("@/hooks/useAIChat", () => ({
  useAIChat: vi.fn(() => ({
    fetchHistory: mockFetchHistory,
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
}

vi.mock("@/store/aiStore", () => ({
  useAIStore: vi.fn(() => mockStoreState),
}))

// Mock AIEditBar to simplify testing the submit behavior
vi.mock("@/components/ai/ai-edit-bar", () => ({
  AIEditBar: ({ onSubmit, isLoading, placeholder }: {
    onSubmit: (cmd: string) => void
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

    // User message bubble container should have justify-end
    const userBubble = screen.getByText("Log my run").closest("div[class]")
    const userContainer = userBubble?.parentElement
    expect(userContainer?.className).toContain("justify-end")

    // Assistant message bubble container should have justify-start
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

    expect(mockSendCommand).toHaveBeenCalledWith("test command", {})
  })
})
