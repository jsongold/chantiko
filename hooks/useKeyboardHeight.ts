"use client"

import { useEffect, useState } from "react"

interface KeyboardState {
  isKeyboardOpen: boolean
  keyboardHeight: number
}

export function useKeyboardHeight(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
  })

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      const keyboardHeight = window.innerHeight - viewport.height
      setState({
        isKeyboardOpen: keyboardHeight > 50,
        keyboardHeight: Math.max(0, keyboardHeight),
      })
    }

    viewport.addEventListener("resize", handleResize)
    return () => viewport.removeEventListener("resize", handleResize)
  }, [])

  return state
}
