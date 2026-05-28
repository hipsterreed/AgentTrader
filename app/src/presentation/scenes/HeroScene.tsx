// Scene 1 — Cold open (3.8s). Tagline kinetic-cascade, orb punch-pops, then
// quick Ken Burns push before the cut.

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { SceneFrame } from '../components/SceneFrame'
import { BrandMark } from '../components/BrandMark'
import { LetterCascade } from '../components/LetterCascade'

export function HeroScene() {
  return (
    <SceneFrame transition="zoom-in">
      {/* Ken Burns push on the entire composition for constant motion */}
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1.04, transition: { duration: 3.8, ease: 'linear' } }}
        className="relative flex flex-col items-center gap-7 text-center"
      >
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: [0, 0.8, 0.55],
            scale: [0.9, 1.15, 1],
            transition: { duration: 1.4, times: [0, 0.4, 1], ease: 'easeOut' },
          }}
          className="absolute -inset-32 -z-10 rounded-full blur-3xl bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-accent)_40%,transparent),transparent_60%)]"
        />

        <BrandMark size="xl" />

        <div className="text-base md:text-xl text-[var(--color-text-muted)] tracking-tight max-w-xl">
          <LetterCascade text="Talk to your portfolio. " delay={0.45} stagger={0.018} />
          <LetterCascade
            text="Trade by voice."
            delay={0.85}
            stagger={0.024}
            className="text-[var(--color-accent)] font-medium"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: { delay: 1.1, duration: 0.5, type: 'spring', stiffness: 260, damping: 16 },
          }}
        >
          <VoiceOrb state="idle" onTap={() => {}} size="lg" />
        </motion.div>
      </motion.div>
    </SceneFrame>
  )
}
