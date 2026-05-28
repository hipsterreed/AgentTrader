// B-roll segment 1 — Brand reveal. Slow Ken Burns push over the full loop so
// even a 15-second screen recording has continuous camera motion. The floor
// of glass tiles is rendered at the Broll page level (viewport-wide) since
// this segment lives inside a max-w-5xl container.

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { BrandMark } from '../components/BrandMark'

interface Props { loopKey: number }

export function BrandRevealSegment({ loopKey }: Props) {
  return (
    <motion.div
      key={loopKey}
      initial={{ scale: 1.0 }}
      animate={{ scale: 1.14, transition: { duration: 6, ease: 'linear' } }}
      className="relative flex flex-col items-center gap-8 text-center"
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: [0, 0.85, 0.55],
          scale: [0.9, 1.18, 1.05],
          transition: { duration: 2.2, times: [0, 0.4, 1], ease: 'easeOut' },
        }}
        className="absolute -inset-36 -z-10 rounded-full blur-3xl bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent)_45%,transparent),transparent_60%)]"
      />

      <BrandMark size="xl" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.7 } }}
        className="text-lg md:text-xl text-[var(--color-text-muted)] tracking-tight max-w-2xl"
      >
        Talk to your portfolio.{' '}
        <span className="text-[var(--color-accent)] font-medium">Trade by voice.</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: { delay: 0.9, duration: 0.55, type: 'spring', stiffness: 240, damping: 18 },
        }}
      >
        <VoiceOrb state="idle" onTap={() => {}} size="lg" />
      </motion.div>
    </motion.div>
  )
}
