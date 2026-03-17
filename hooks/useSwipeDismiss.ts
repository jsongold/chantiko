"use client"

import { useCallback, useRef, useState } from "react"

interface UseSwipeDismissOptions {
  onDismiss: () => void
  threshold?: number
}

interface UseSwipeDismissResult {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
  translateY: number
}

export function useSwipeDismiss({
  onDismiss,
  threshold = 80,
}: UseSwipeDismissOptions): UseSwipeDismissResult {
  const startY = useRef(0)
  const [translateY, setTranslateY] = useState(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - startY.current
    if (deltaY > 0) {
      setTranslateY(deltaY)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (translateY > threshold) {
      onDismiss()
    }
    setTranslateY(0)
  }, [translateY, threshold, onDismiss])

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    translateY,
  }
}
