// Floating product-card collage for the Brand-Reveal cover. Four cards peek
// in from the corners, each tilted at a different angle and gently breathing,
// so the cover photo reads as "here's everything this product does" without
// needing the viewer to flip through B-roll segments.
//
// Cards sit BEHIND the wordmark/orb composition (z-0) and partially off-screen
// so the focal mark stays the hero. They use real product card components
// with the same fixtures the B-roll segments use.

import { motion } from 'motion/react'
import { TickerCard } from '@/cards/TickerCard'
import { PortfolioCard } from '@/cards/PortfolioCard'
import { RecommendationCard, type RecommendationCardData } from '@/cards/RecommendationCard'
import { ScheduledOrdersCard, type ScheduledOrdersCardData } from '@/cards/ScheduledOrdersCard'
import { BRIEF_FIXTURE, NVDA_FIXTURE } from '../fixtures'

const REC_FIXTURE: RecommendationCardData = {
  kind: 'recommendation',
  side: 'buy',
  symbol: 'NVDA',
  qty: 15,
  estCost: 2083,
  confidence: 0.87,
  thesis:
    'Cloud capex up 40% YoY. Sector rotation into hyperscalers. Adding here keeps your beta in line.',
  catalysts: ['Capex print', 'AI hyperscalers'],
}

const SCHEDULED_FIXTURE: ScheduledOrdersCardData = {
  kind: 'scheduled',
  orders: [
    { id: 'a', side: 'buy', symbol: 'NVDA', amount: 500, frequency: 'Weekly', nextRun: 'Mon · 9:30 AM ET' },
    { id: 'b', side: 'buy', symbol: 'VOO', amount: 1000, frequency: 'Monthly', nextRun: '1st · market open' },
    { id: 'c', side: 'buy', symbol: 'BTC/USD', amount: 250, frequency: 'Daily', nextRun: 'Tomorrow · 8:00 AM' },
  ],
}

export function SideCards() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Top-left — ticker peeks in tilted left */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-9, -7, -9] }}
        transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
        className="absolute"
        style={{
          top: '6%',
          left: '7%',
          width: '20rem',
          opacity: 0.85,
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.45)) drop-shadow(0 0 20px color-mix(in oklab, var(--color-accent) 25%, transparent))',
        }}
      >
        <TickerCard data={NVDA_FIXTURE} />
      </motion.div>

      {/* Top-right — portfolio tilted right */}
      <motion.div
        animate={{ y: [0, 12, 0], rotate: [8, 6, 8] }}
        transition={{ duration: 7.2, ease: 'easeInOut', repeat: Infinity }}
        className="absolute"
        style={{
          top: '4%',
          right: '7%',
          width: '22rem',
          opacity: 0.85,
          filter: 'drop-shadow(0 22px 44px rgba(0,0,0,0.5)) drop-shadow(0 0 22px color-mix(in oklab, var(--color-accent) 25%, transparent))',
        }}
      >
        <PortfolioCard data={BRIEF_FIXTURE} />
      </motion.div>

      {/* Mid-lower-left — AI recommendation tilted left, slightly larger */}
      <motion.div
        animate={{ y: [0, 8, 0], rotate: [-7, -9, -7] }}
        transition={{ duration: 7.8, ease: 'easeInOut', repeat: Infinity }}
        className="absolute"
        style={{
          bottom: '8%',
          left: '7%',
          width: '22rem',
          opacity: 0.82,
          filter: 'drop-shadow(0 22px 44px rgba(0,0,0,0.5)) drop-shadow(0 0 22px color-mix(in oklab, var(--color-loss) 28%, transparent))',
        }}
      >
        <RecommendationCard data={REC_FIXTURE} />
      </motion.div>

      {/* Mid-lower-right — scheduled orders tilted right */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [6, 8, 6] }}
        transition={{ duration: 6.8, ease: 'easeInOut', repeat: Infinity }}
        className="absolute"
        style={{
          bottom: '10%',
          right: '7%',
          width: '22rem',
          opacity: 0.82,
          filter: 'drop-shadow(0 22px 44px rgba(0,0,0,0.5)) drop-shadow(0 0 22px color-mix(in oklab, var(--color-accent-2) 25%, transparent))',
        }}
      >
        <ScheduledOrdersCard data={SCHEDULED_FIXTURE} />
      </motion.div>
    </div>
  )
}
