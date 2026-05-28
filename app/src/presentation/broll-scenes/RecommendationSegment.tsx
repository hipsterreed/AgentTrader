// B-roll segment 4 — AI recommendation. Header slides in, confidence ticks
// up, card materializes, thesis fades in last. Sells the "opinionated AI"
// pitch beat.

import { motion } from 'motion/react'
import { RecommendationCard, type RecommendationCardData } from '@/cards/RecommendationCard'
import { LetterCascade } from '../components/LetterCascade'

interface Props { loopKey: number }

const REC_FIXTURE: RecommendationCardData = {
  kind: 'recommendation',
  side: 'buy',
  symbol: 'NVDA',
  qty: 15,
  estCost: 2083,
  confidence: 0.87,
  thesis:
    'Cloud capex up 40% YoY. Sector rotation into hyperscalers. Your existing 30 positions you well — adding here keeps beta in line.',
  catalysts: ['Capex print', 'AI hyperscalers', 'Your position'],
}

export function RecommendationSegment({ loopKey }: Props) {
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
        className="text-[10.5px] uppercase tracking-[0.32em] text-[var(--color-accent)] font-semibold"
      >
        <LetterCascade text="Agent's call" stagger={0.018} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.78, y: 28 }}
        animate={{
          opacity: 1, scale: 1, y: 0,
          transition: { delay: 0.25, duration: 0.55, type: 'spring', stiffness: 230, damping: 19 },
        }}
        className="w-full"
      >
        <RecommendationCard data={REC_FIXTURE} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.5, duration: 0.4 } }}
        className="text-sm text-[var(--color-text-muted)] text-center max-w-sm leading-relaxed"
      >
        Conviction. Not <em>"do your own research"</em>.
      </motion.div>
    </motion.div>
  )
}
