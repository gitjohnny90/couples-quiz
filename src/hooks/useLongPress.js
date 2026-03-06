import { useRef, useCallback } from 'react'

/**
 * Hook that detects long-press (hold) gestures.
 * Returns event handler props to spread onto any element.
 *
 * - Short tap → normal click passes through
 * - Hold 500ms → fires callback, suppresses the next click
 * - Dragging (>10px) cancels the long-press
 */
export default function useLongPress(onLongPress, ms = 500) {
  const timerRef = useRef(null)
  const suppressClickRef = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback((e) => {
    // Only handle primary button / single touch
    if (e.button && e.button !== 0) return

    firedRef.current = false
    suppressClickRef.current = false
    startPos.current = { x: e.clientX, y: e.clientY }

    clear()
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      suppressClickRef.current = true
      onLongPress(e)
    }, ms)
  }, [onLongPress, ms, clear])

  const onPointerUp = useCallback(() => {
    clear()
  }, [clear])

  const onPointerMove = useCallback((e) => {
    if (!timerRef.current) return
    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clear()
    }
  }, [clear])

  const onPointerCancel = useCallback(() => {
    clear()
  }, [clear])

  // Suppress click if long-press fired
  const onClick = useCallback((e) => {
    if (suppressClickRef.current) {
      e.stopPropagation()
      e.preventDefault()
      suppressClickRef.current = false
    }
  }, [])

  // Prevent context menu on long-press (mobile + desktop)
  const onContextMenu = useCallback((e) => {
    if (firedRef.current) {
      e.preventDefault()
    }
  }, [])

  return {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onPointerCancel,
    onClick,
    onContextMenu,
  }
}
