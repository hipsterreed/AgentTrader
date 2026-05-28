// B-roll segment 7 — Powered by ElevenLabs. The attribution beat: orb pulses,
// divider scales in, wordmark cascades, light-sweep gloss. Loops every ~7s
// so you can record any length and the gloss-sweep is always visible.

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { LetterCascade } from '../components/LetterCascade'

interface Props { loopKey: number }

// Vite-resolved import — picks up app/src/assets/elevenlabs.svg|png if you
// drop the official mark in there; falls back to a typeset wordmark otherwise.
const brandAssets = import.meta.glob<{ default: string }>(
  '/src/assets/elevenlabs.{svg,png}',
  { eager: true },
)
const brandUrl = Object.values(brandAssets)[0]?.default

export function ElevenLabsSegment({ loopKey }: Props) {
  return (
    <motion.div
      key={loopKey}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}
      className="flex flex-col items-center gap-7 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.35 } }}
        className="text-[11px] uppercase tracking-[0.42em] text-[var(--color-text-muted)] font-semibold"
      >
        Powered by
      </motion.div>

      <div className="flex items-center gap-8 md:gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { delay: 0.25, duration: 0.5, type: 'spring', stiffness: 230, damping: 18 },
          }}
        >
          <VoiceOrb state="speaking" onTap={() => {}} size="md" />
        </motion.div>

        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1, transition: { delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="h-24 w-px bg-[color-mix(in_oklab,var(--color-accent)_60%,transparent)] origin-center shadow-[0_0_12px_var(--color-accent)]"
        />

        {brandUrl ? (
          <motion.img
            src={brandUrl}
            alt="ElevenLabs"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.55, duration: 0.45 } }}
            className="h-12 md:h-16 w-auto"
          />
        ) : (
          <div className="text-6xl md:text-7xl font-bold tracking-tight text-[var(--color-text)]">
            <LetterCascade text="ElevenLabs" delay={0.55} stagger={0.035} duration={0.4} />
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.3, duration: 0.45 } }}
        className="text-base text-[var(--color-text-muted)] tracking-tight"
      >
        Speech Engine ·{' '}
        <span className="text-[var(--color-accent)] font-medium">Sub-second voice turns</span>
      </motion.div>
    </motion.div>
  )
}
