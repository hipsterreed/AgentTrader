// Scene 5 — Powered by ElevenLabs (3.8s). Required attribution. Wordmark
// cascades, divider scales, orb pulses brighter. Quick light-sweep gloss.

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { SceneFrame } from '../components/SceneFrame'
import { LetterCascade } from '../components/LetterCascade'

const brandAssets = import.meta.glob<{ default: string }>(
  '/src/assets/elevenlabs.{svg,png}',
  { eager: true },
)
const brandUrl = Object.values(brandAssets)[0]?.default

export function ElevenLabsScene() {
  return (
    <SceneFrame transition="zoom-out">
      <div className="flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }}
          className="text-[11px] uppercase tracking-[0.42em] text-[var(--color-text-muted)] font-semibold"
        >
          Powered by
        </motion.div>

        <div className="flex items-center gap-7 md:gap-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { delay: 0.18, duration: 0.4, type: 'spring', stiffness: 240, damping: 18 },
            }}
          >
            <VoiceOrb state="speaking" onTap={() => {}} size="md" />
          </motion.div>

          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1, transition: { delay: 0.32, duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
            className="h-20 w-px bg-[color-mix(in_oklab,var(--color-accent)_60%,transparent)] origin-center shadow-[0_0_12px_var(--color-accent)]"
          />

          <div className="relative">
            {brandUrl ? (
              <motion.img
                src={brandUrl}
                alt="ElevenLabs"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.4, duration: 0.4 } }}
                className="h-10 md:h-14 w-auto"
              />
            ) : (
              <div className="text-5xl md:text-6xl font-bold tracking-tight text-[var(--color-text)]">
                <LetterCascade text="ElevenLabs" delay={0.4} stagger={0.03} duration={0.35} />
              </div>
            )}

            {/* Light-sweep gloss across the wordmark */}
            <motion.span
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '120%', transition: { delay: 0.9, duration: 0.7, ease: 'easeOut' } }}
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent mix-blend-screen"
              style={{ transform: 'skewX(-20deg)' }}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.0, duration: 0.4 } }}
          className="text-sm text-[var(--color-text-muted)] tracking-tight"
        >
          Speech Engine · <span className="text-[var(--color-accent)] font-medium">Sub-second voice turns</span>
        </motion.div>
      </div>
    </SceneFrame>
  )
}
