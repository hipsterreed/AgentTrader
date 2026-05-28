// Auto-advancing rAF clock that drives scene index over a fixed timeline.
// We keep elapsedMs in a ref (rAF writes 60Hz, no React state churn) and only
// fire setState when the *scene index* crosses — that's the only thing React
// needs to react to. Scenes own their internal beat sequencing via setTimeout
// on mount, which AnimatePresence remounts cleanly for us per scene change.

import { useCallback, useEffect, useRef, useState } from 'react'

export interface SceneDef {
  id: string
  durationMs: number
}

export interface UseTimelineResult {
  currentIndex: number
  isPaused: boolean
  pause: () => void
  resume: () => void
  toggle: () => void
  restart: () => void
  next: () => void
  prev: () => void
  /** Imperatively read elapsed ms (useful if a scene wants to derive progress) */
  getElapsedMs: () => number
}

interface Options {
  /** When true (default), loops back to scene 0 at the end. */
  autoLoop?: boolean
  /** Initial scene index to start from. */
  startIndex?: number
}

export function useTimeline(
  scenes: SceneDef[],
  opts: Options = {},
): UseTimelineResult {
  const { autoLoop = true, startIndex = 0 } = opts

  // Cumulative scene boundaries: [0, d0, d0+d1, ...]
  const boundariesRef = useRef<number[]>([])
  const totalMsRef = useRef(0)
  if (boundariesRef.current.length !== scenes.length + 1) {
    const b: number[] = [0]
    let acc = 0
    for (const s of scenes) {
      acc += s.durationMs
      b.push(acc)
    }
    boundariesRef.current = b
    totalMsRef.current = acc
  }

  const elapsedRef = useRef<number>(boundariesRef.current[startIndex] ?? 0)
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  // Mirror current scene index in a ref so rapid-fire calls to next()/prev()
  // (within the same JS task, before React re-renders) read the latest value
  // rather than a stale closure.
  const currentIndexRef = useRef(startIndex)
  currentIndexRef.current = currentIndex

  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  isPausedRef.current = isPaused

  // Single rAF loop owned by this hook. Uses elapsedRef so pausing just stops
  // the integration without resetting the clock.
  useEffect(() => {
    let raf = 0
    let lastTs: number | null = null

    const tick = (ts: number) => {
      if (lastTs == null) lastTs = ts
      const dt = ts - lastTs
      lastTs = ts

      if (!isPausedRef.current) {
        let next = elapsedRef.current + dt
        if (next >= totalMsRef.current) {
          if (autoLoop) {
            next = next % totalMsRef.current
          } else {
            next = totalMsRef.current
          }
        }
        elapsedRef.current = next

        // Find which scene we're in. Linear scan — 6 scenes, trivial.
        const b = boundariesRef.current
        let idx = 0
        for (let i = 0; i < b.length - 1; i++) {
          if (next >= b[i] && next < b[i + 1]) { idx = i; break }
          if (i === b.length - 2 && next >= b[i + 1]) idx = i
        }
        setCurrentIndex((prev) => (prev === idx ? prev : idx))
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoLoop])

  const jumpToScene = useCallback((idx: number) => {
    const b = boundariesRef.current
    const clamped = ((idx % scenes.length) + scenes.length) % scenes.length
    elapsedRef.current = b[clamped]
    currentIndexRef.current = clamped
    setCurrentIndex(clamped)
  }, [scenes.length])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])
  const toggle = useCallback(() => setIsPaused((p) => !p), [])
  const restart = useCallback(() => {
    elapsedRef.current = 0
    currentIndexRef.current = 0
    setCurrentIndex(0)
    setIsPaused(false)
  }, [])
  const next = useCallback(() => jumpToScene(currentIndexRef.current + 1), [jumpToScene])
  const prev = useCallback(() => jumpToScene(currentIndexRef.current - 1), [jumpToScene])
  const getElapsedMs = useCallback(() => elapsedRef.current, [])

  return { currentIndex, isPaused, pause, resume, toggle, restart, next, prev, getElapsedMs }
}
