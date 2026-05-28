// B-roll segment 6 — Scheduled orders queue. Header slides in, list rows
// cascade with a brief stagger. Sells the autonomous/scheduled side.

import { motion } from 'motion/react'
import { ScheduledOrdersCard, type ScheduledOrdersCardData } from '@/cards/ScheduledOrdersCard'
import { LetterCascade } from '../components/LetterCascade'

interface Props { loopKey: number }

const SCHEDULED_FIXTURE: ScheduledOrdersCardData = {
  kind: 'scheduled',
  orders: [
    { id: 'a', side: 'buy', symbol: 'NVDA', amount: 500, frequency: 'Weekly', nextRun: 'Mon · 9:30 AM ET' },
    { id: 'b', side: 'buy', symbol: 'VOO',  amount: 1000, frequency: 'Monthly', nextRun: '1st · market open' },
    { id: 'c', side: 'buy', symbol: 'BTC/USD', amount: 250, frequency: 'Daily', nextRun: 'Tomorrow · 8:00 AM' },
  ],
}

export function ScheduledOrdersSegment({ loopKey }: Props) {
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
        <LetterCascade text="Running on autopilot" stagger={0.014} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 24 }}
        animate={{
          opacity: 1, scale: 1, y: 0,
          transition: { delay: 0.25, duration: 0.55, type: 'spring', stiffness: 230, damping: 19 },
        }}
        className="w-full"
      >
        <ScheduledOrdersCard data={SCHEDULED_FIXTURE} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.7, duration: 0.4 } }}
        className="text-sm text-[var(--color-text-muted)] text-center max-w-sm leading-relaxed"
      >
        Recurring buys, alerts, watchlists —{' '}
        <span className="text-[var(--color-accent)] font-semibold">all by voice.</span>
      </motion.div>
    </motion.div>
  )
}
