// Tweens a number from `from` → `to` over `durationMs` using rAF. Returns the
// current rounded value as React state. Used for hero stat reveals in scenes.

import { useEffect, useState } from 'react'

interface Options {
  from?: number
  to: number
  durationMs?: number
  /** Number of fixed decimals to preserve when rounding. Default 0. */
  decimals?: number
  /** Easing — defaults to a soft easeOutCubic. */
  ease?: (t: number) => number
  /** Reset & replay whenever this key changes. */
  triggerKey?: unknown
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function useCountUp({
  from = 0,
  to,
  durationMs = 1200,
  decimals = 0,
  ease = easeOutCubic,
  triggerKey,
}: Options): number {
  const [value, setValue] = useState(from)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const factor = Math.pow(10, decimals)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const v = from + (to - from) * ease(t)
      setValue(Math.round(v * factor) / factor)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, durationMs, decimals, triggerKey])

  return value
}
