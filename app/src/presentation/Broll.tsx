// B-roll page — manual-navigation visuals you screen-record under your own
// face-cam narration in CapCut. Each segment auto-loops while displayed so a
// 5-second or 30-second take both work; you press a number key to jump.
//
// Visit at http://localhost:5176/#/broll
//
// Keyboard:
//   1–6        — jump to segment
//   ←/→        — prev/next
//   Space      — pause/resume current loop (still displays last frame)
//   R          — restart current loop from t=0
//   M          — toggle split-screen preview (top 60% safe area for PIP)
//   H          — hide chrome (record-ready)

import { useEffect, useRef, useState, type ReactElement } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Maximize2, MonitorSmartphone } from 'lucide-react'

import { AmbientGrid } from '@/components/ambient-grid'
import { BlockGrid } from './components/BlockGrid'
import { SideCards } from './components/SideCards'
import { BrandRevealSegment } from './broll-scenes/BrandRevealSegment'
import { PortfolioCheckSegment } from './broll-scenes/PortfolioCheckSegment'
import { MarketAnalysisSegment } from './broll-scenes/MarketAnalysisSegment'
import { RecommendationSegment } from './broll-scenes/RecommendationSegment'
import { VoiceTradeSegment } from './broll-scenes/VoiceTradeSegment'
import { ScheduledOrdersSegment } from './broll-scenes/ScheduledOrdersSegment'
import { ElevenLabsSegment } from './broll-scenes/ElevenLabsSegment'

interface SegmentDef {
  id: string
  label: string
  loopMs: number
  render: (loopKey: number) => ReactElement
}

const SEGMENTS: SegmentDef[] = [
  { id: 'brand',         label: 'Brand reveal',    loopMs: 6500,  render: (k) => <BrandRevealSegment loopKey={k} /> },
  { id: 'portfolio',     label: 'Portfolio check', loopMs: 7500,  render: (k) => <PortfolioCheckSegment loopKey={k} /> },
  { id: 'market',        label: 'Market analysis', loopMs: 6500,  render: (k) => <MarketAnalysisSegment loopKey={k} /> },
  { id: 'recommendation',label: 'AI recommendation', loopMs: 7000, render: (k) => <RecommendationSegment loopKey={k} /> },
  { id: 'trade',         label: 'Voice trade',     loopMs: 8000,  render: (k) => <VoiceTradeSegment loopKey={k} /> },
  { id: 'scheduled',     label: 'Scheduled orders', loopMs: 7000, render: (k) => <ScheduledOrdersSegment loopKey={k} /> },
  { id: 'elevenlabs',    label: 'Powered by ElevenLabs', loopMs: 7000, render: (k) => <ElevenLabsSegment loopKey={k} /> },
]

export function Broll() {
  const [segmentIdx, setSegmentIdx] = useState(0)
  const [loopKey, setLoopKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const [splitMode, setSplitMode] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const segmentIdxRef = useRef(segmentIdx)
  segmentIdxRef.current = segmentIdx

  const segment = SEGMENTS[segmentIdx]

  // Loop driver — kicks loopKey forward when the current segment's loopMs
  // elapses. Cleared on pause / segment change.
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setLoopKey((k) => k + 1), segment.loopMs)
    return () => clearInterval(id)
  }, [segment.loopMs, paused, segmentIdx])

  // Switching segments resets the loop counter so the new segment starts
  // fresh rather than mid-cycle.
  useEffect(() => {
    setLoopKey(0)
  }, [segmentIdx])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

      if (e.key >= '1' && e.key <= '9') {
        const i = parseInt(e.key, 10) - 1
        if (i < SEGMENTS.length) {
          setSegmentIdx(i)
          return
        }
      }
      switch (e.key) {
        case 'ArrowRight':
          setSegmentIdx((i) => (i + 1) % SEGMENTS.length); break
        case 'ArrowLeft':
          setSegmentIdx((i) => (i - 1 + SEGMENTS.length) % SEGMENTS.length); break
        case ' ':
          e.preventDefault(); setPaused((p) => !p); break
        case 'r': case 'R':
          setLoopKey((k) => k + 1); break
        case 'm': case 'M':
          setSplitMode((s) => !s); break
        case 'h': case 'H':
          setShowChrome((s) => !s); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-bg-1)]">
      {/* Ambient backdrop */}
      <AmbientGrid />

      {/* Slow pan background — matches the trailer's always-moving feel */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--color-accent-deep) 35%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 65%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Brand-reveal-only: floor of translucent glass tiles (landing.png
          inspiration) + collage of product cards peeking in from the corners.
          Sit between the ambient backdrop and the focal composition.
          AnimatePresence crossfades them when leaving the segment. */}
      <AnimatePresence>
        {segment.id === 'brand' && (
          <motion.div
            key="brand-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="absolute inset-0"
          >
            <BlockGrid heightPct={65} />
            <SideCards />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage — when splitMode is on, content shrinks to the top 60% so the
          bottom 40% is empty (where your face-cam will sit in CapCut). */}
      <div
        className={
          splitMode
            ? 'absolute inset-x-0 top-0 h-[60%] flex items-center justify-center px-6 overflow-hidden'
            : 'absolute inset-0 flex items-center justify-center px-6'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${segment.id}-${loopKey}`}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.25 } }}
            className="w-full max-w-5xl flex items-center justify-center"
          >
            {segment.render(loopKey)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Split-mode preview: dashed line marking the safe area boundary */}
      {splitMode && showChrome && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[60%] border-t border-dashed border-[var(--color-accent)]/30"
        >
          <div className="absolute top-1 right-3 text-[9px] uppercase tracking-[0.22em] text-[var(--color-accent)]/70 font-semibold">
            face-cam area
          </div>
        </div>
      )}

      {/* Recording chrome */}
      {showChrome && (
        <>
          {/* Top-left: current segment label + index */}
          <div className="pointer-events-none absolute top-3 left-4 z-40 flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] font-semibold opacity-80">
            <span className="text-[var(--color-accent)] tnum">
              {String(segmentIdx + 1).padStart(2, '0')} / {String(SEGMENTS.length).padStart(2, '0')}
            </span>
            <span className="text-[var(--color-text)]">{segment.label}</span>
            {paused && <span className="text-[var(--color-warn)]">· paused</span>}
          </div>

          {/* Bottom-right: shortcuts hint */}
          <div className="pointer-events-none absolute bottom-3 right-4 z-40 flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)] font-semibold opacity-70">
            <div className="flex items-center gap-2">
              {splitMode ? (
                <span className="flex items-center gap-1 text-[var(--color-accent)]">
                  <MonitorSmartphone className="size-3" />
                  split
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Maximize2 className="size-3" />
                  full
                </span>
              )}
            </div>
            <div className="text-[9px] normal-case tracking-normal opacity-80">
              1–6 · jump &nbsp; ←/→ · prev/next &nbsp; space · pause &nbsp; r · restart &nbsp; m · split &nbsp; h · chrome
            </div>
          </div>

          {/* Bottom-left: segment selector pills */}
          <div className="pointer-events-none absolute bottom-3 left-4 z-40 flex flex-wrap gap-1.5 max-w-[60%]">
            {SEGMENTS.map((s, i) => (
              <span
                key={s.id}
                className={
                  i === segmentIdx
                    ? 'text-[9.5px] uppercase tracking-[0.18em] font-semibold rounded-full px-2 py-1 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/50 text-[var(--color-accent)]'
                    : 'text-[9.5px] uppercase tracking-[0.18em] font-semibold rounded-full px-2 py-1 bg-[color-mix(in_oklab,var(--color-surface)_50%,transparent)] border border-[var(--color-border)]/40 text-[var(--color-text-dim)]'
                }
              >
                {i + 1} {s.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
