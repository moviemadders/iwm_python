"use client"

import { useCallback } from "react"

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error"

/**
 * A hook to trigger haptic feedback on supported devices using the Vibration API.
 * 
 * Usage:
 * const { trigger } = useHaptic()
 * <button onClick={() => trigger('light')}>Click me</button>
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticType = "light") => {
    // Check if vibration API is supported
    if (typeof navigator === "undefined" || !navigator.vibrate) {
      return
    }

    try {
      switch (type) {
        case "light":
          navigator.vibrate(10) // Very short, crisp tap
          break
        case "medium":
          navigator.vibrate(20) // Noticeable tap
          break
        case "heavy":
          navigator.vibrate(40) // Strong thud
          break
        case "success":
          navigator.vibrate([10, 30, 10]) // Two quick taps
          break
        case "warning":
          navigator.vibrate([30, 50, 10]) // Long-short
          break
        case "error":
          navigator.vibrate([50, 30, 50, 30, 50]) // Three heavy vibrations
          break
        default:
          navigator.vibrate(10)
      }
    } catch (e) {
      // Ignore errors if vibration fails (e.g. user interaction required)
      console.debug("Haptic feedback failed", e)
    }
  }, [])

  return { trigger }
}
