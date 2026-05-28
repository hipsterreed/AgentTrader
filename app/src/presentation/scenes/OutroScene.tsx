// Scene 6 — Outro (3.6s). Final poster, tagline cascades, hold and loop.

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { SceneFrame } from '../components/SceneFrame'
import { BrandMark } from '../components/BrandMark'
import { LetterCascade } from '../components/LetterCascade'

export function OutroScene() {
  return (
    <SceneFrame transition="zoom-in">
      <div className="flex flex-col items-center gap-6 text-center">
        <BrandMark size="lg" />

        <div className="text-base md:text-lg text-[var(--color-text-muted)] tracking-tight max-w-xl">
          <LetterCascade text="Alpaca paper today. " delay={0.4} stagger={0.018} />
          <LetterCascade
            text="Broker-agnostic by design."
            delay={0.75}
            stagger={0.022}
            className="text-[var(--color-accent)] font-medium"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { delay: 0.65, duration: 0.4, type: 'spring', stiffness: 260, damping: 18 },
          }}
        >
          <VoiceOrb state="idle" onTap={() => {}} size="md" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={{
            opacity: 1,
            letterSpacing: '0.42em',
            transition: { delay: 1.15, duration: 0.5 },
          }}
          className="text-[10.5px] uppercase text-[var(--color-text-dim)] font-semibold"
        >
          #ElevenHacks · 2026
        </motion.div>
      </div>
    </SceneFrame>
  )
}
