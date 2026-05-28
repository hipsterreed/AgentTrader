// B-roll segment 2 — Portfolio check. Card materializes, day P&L counts up,
// positions cascade in, then values briefly pulse to sell the "always live"
// idea before the loop restarts.

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PortfolioCard } from '@/cards/PortfolioCard'
import { useCountUp } from '../hooks/useCountUp'
import { BRIEF_FIXTURE } from '../fixtures'
import { LetterCascade } from '../components/LetterCascade'

interface Props { loopKey: number }

export function PortfolioCheckSegment({ loopKey }: Props) {
  const [pulseKey, setPulseKey] = useState(0)
  // Mid-loop pulse so the card "ticks" — sells the live-updating story.
  useEffect(() => {
    const t = setTimeout(() => setPulseKey((k) => k + 1), 3800)
    return () => clearTimeout(t)
  }, [loopKey])

  const dollars = useCountUp({
    to: BRIEF_FIXTURE.dayPL, durationMs: 1200, decimals: 0, triggerKey: `${loopKey}-${pulseKey}`,
  })
  const pct = useCountUp({
    to: BRIEF_FIXTURE.dayPLPct, durationMs: 1200, decimals: 2, triggerKey: `${loopKey}-${pulseKey}`,
  })

  return (
    <motion.div
      key={loopKey}
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}
      className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] items-center gap-10 max-w-5xl w-full"
    >
      {/* Left — hero stat with cascading text */}
      <motion.div
        initial={{ opacity: 0, x: -28 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.15, duration: 0.5 } }}
        className="flex flex-col items-start gap-3"
      >
        <div className="text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-accent)] font-semibold">
          <LetterCascade text="Live portfolio" stagger={0.018} />
        </div>
        <div className="flex items-baseline gap-3">
          <motion.div
            key={pulseKey}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1, transition: { duration: 0.4, type: 'spring', stiffness: 260, damping: 20 } }}
            className="text-6xl md:text-7xl font-semibold tracking-tight text-[var(--color-accent)] tnum"
            style={{ textShadow: '0 0 28px color-mix(in oklab, var(--color-accent) 50%, transparent)' }}
          >
            +${dollars.toLocaleString()}
          </motion.div>
          <div className="text-2xl md:text-3xl font-medium text-[var(--color-accent)]/80 tnum">
            +{pct.toFixed(2)}%
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.4 } }}
          className="text-base text-[var(--color-text-muted)] max-w-md leading-relaxed"
        >
          Day P&L · positions · buying power — spoken back in a sentence.
        </motion.div>
      </motion.div>

      {/* Right — portfolio card with subtle pulse on value tick */}
      <motion.div
        key={`card-${pulseKey}`}
        initial={{ opacity: 0, scale: 0.85, rotate: 3 }}
        animate={{
          opacity: 1, scale: 1, rotate: 0,
          transition: { delay: 0.25, duration: 0.5, type: 'spring', stiffness: 220, damping: 19 },
        }}
        className="w-full max-w-sm justify-self-center md:justify-self-end glow-accent-soft rounded-[14px]"
      >
        <PortfolioCard data={BRIEF_FIXTURE} />
      </motion.div>
    </motion.div>
  )
}
