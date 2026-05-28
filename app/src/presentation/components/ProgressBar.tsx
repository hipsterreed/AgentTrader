// Thin progress line pinned to the top. Driven by elapsed/total — not a
// motion animation, just a rAF-ticked width update via direct DOM write to
// avoid setState pressure on every frame.

import { useEffect, useRef } from 'react'

interface Props {
  /** Function that returns elapsed ms (read on every rAF tick). */
  getElapsedMs: () => number
  totalMs: number
  show?: boolean
}

export function ProgressBar({ getElapsedMs, totalMs, show = true }: Props) {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = fillRef.current
      if (el) {
        const pct = Math.min(100, (getElapsedMs() / totalMs) * 100)
        el.style.width = `${pct}%`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getElapsedMs, totalMs])

  if (!show) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[2px] bg-[color-mix(in_oklab,var(--color-bg-0)_60%,transparent)]">
      <div
        ref={fillRef}
        className="h-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"
        style={{ width: '0%', transition: 'width 80ms linear' }}
      />
    </div>
  )
}
