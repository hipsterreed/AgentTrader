// B-roll segment 3 — Market analysis. Ticker card slams in with sparkline
// wipe; commentary line reveals last. Designed to read in any 5+ second crop.

import { motion } from 'motion/react'
import { TickerCard } from '@/cards/TickerCard'
import { LetterCascade } from '../components/LetterCascade'
import { NVDA_FIXTURE } from '../fixtures'

interface Props { loopKey: number }

export function MarketAnalysisSegment({ loopKey }: Props) {
  return (
    <motion.div
      key={loopKey}
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.4 } }}
      className="flex flex-col items-center gap-5 w-full max-w-md"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } }}
        className="text-[10.5px] uppercase tracking-[0.32em] text-[var(--color-accent-2)] font-semibold flex items-center gap-2"
      >
        <span className="size-1.5 rounded-full bg-[var(--color-accent)] animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
        <LetterCascade text="Live tape · NYSE" stagger={0.014} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.75, y: 24 }}
        animate={{
          opacity: 1, scale: 1, y: 0,
          transition: { delay: 0.25, duration: 0.5, type: 'spring', stiffness: 240, damping: 19 },
        }}
        className="w-full glow-accent-soft rounded-[14px]"
      >
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{
            clipPath: 'inset(0 0% 0 0)',
            transition: { delay: 0.55, duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          <TickerCard data={NVDA_FIXTURE} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 1.6, duration: 0.35 } }}
        className="text-sm text-[var(--color-text-muted)] text-center max-w-sm leading-relaxed"
      >
        You're long thirty —
        <span className="text-[var(--color-accent)] font-semibold"> sitting on six-twelve.</span>
      </motion.div>
    </motion.div>
  )
}
