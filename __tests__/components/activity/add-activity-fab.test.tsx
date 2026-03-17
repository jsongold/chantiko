import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

let mockAIMode = "ask"
vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ aiMode: mockAIMode })
  ),
}))

let mockFeatures = { aiChat: true }
vi.mock("@/lib/features", () => ({
  get features() { return mockFeatures },
}))

// Fab renders a plain button via Button internally
vi.mock("@/components/shared/fab", () => ({
  Fab: ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button onClick={onClick} aria-label={label} />
  ),
}))

import { ChikoFab } from "@/components/shared/chiko-fab"

describe("ChikoFab", () => {
  const onManualOpen = vi.fn()
  const onAIOpen = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAIMode = "ask"
    mockFeatures = { aiChat: true }
  })

  it("shows Bot icon label when aiMode is ask", () => {
    render(<ChikoFab onManualOpen={onManualOpen} onAIOpen={onAIOpen} />)
    expect(screen.getByRole("button", { name: /open ai chat/i })).toBeInTheDocument()
  })

  it("tap calls onAIOpen when aiMode is ask", () => {
    render(<ChikoFab onManualOpen={onManualOpen} onAIOpen={onAIOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onAIOpen).toHaveBeenCalledOnce()
    expect(onManualOpen).not.toHaveBeenCalled()
  })

  it("tap calls onAIOpen when aiMode is auto", () => {
    mockAIMode = "auto"
    render(<ChikoFab onManualOpen={onManualOpen} onAIOpen={onAIOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onAIOpen).toHaveBeenCalledOnce()
  })

  it("tap calls onManualOpen when aiMode is manual", () => {
    mockAIMode = "manual"
    render(<ChikoFab onManualOpen={onManualOpen} onAIOpen={onAIOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onManualOpen).toHaveBeenCalledOnce()
    expect(onAIOpen).not.toHaveBeenCalled()
  })

  it("tap calls onManualOpen when aiChat feature is disabled", () => {
    mockFeatures = { aiChat: false }
    mockAIMode = "ask"
    render(<ChikoFab onManualOpen={onManualOpen} onAIOpen={onAIOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onManualOpen).toHaveBeenCalledOnce()
    expect(onAIOpen).not.toHaveBeenCalled()
  })
})
