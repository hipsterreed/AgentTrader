// B-roll segment 1 — Brand reveal. Tuned for GIF capture: every motion in
// the composition is on a continuous loop, so a 4-second screen-recorded
// crop loops seamlessly with no jump cut.
//
// Layers (back → front):
//   1. BlockGrid floor (viewport-wide, rendered at Broll page level)
//   2. Floating Particles drifting up
//   3. Ken Burns oscillation on the focal composition (camera breath)
//   4. Stacked radial halos behind the wordmark + orb
//   5. Wordmark with multi-layer text-shadow glow
//   6. Tagline
//   7. Orb (with --color-loss override → brighter pink throughout)

import { motion } from 'motion/react'
import { VoiceOrb } from '@/components/voice-orb'
import { BrandMark } from '../components/BrandMark'
import { Particles } from '../components/Particles'

interface Props { loopKey: number }

export function BrandRevealSegment({ loopKey }: Props) {
  return (
    <>
      {/* Floating particles layer — viewport-wide, sits between the cube
          floor (rendered by Broll) and the centered composition below. */}
      <Particles count={26} />

      <motion.div
        key={loopKey}
        // Gentle camera breathing — symmetric, so a GIF loops with no seam.
        animate={{ scale: [1.0, 1.06, 1.0] }}
        transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
        className="relative flex flex-col items-center gap-9 text-center"
      >
        {/* Big back-of-frame halo — teal core with a magenta outer ring,
            both breathing in counter-rhythm for chromatic depth. */}
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.55, 0.9, 0.55],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 4.2, ease: 'easeInOut', repeat: Infinity }}
          className="absolute -inset-40 -z-10 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in oklab, var(--color-accent) 55%, transparent), transparent 55%)',
          }}
        />
        <motion.div
          aria-hidden
          animate={{
            opacity: [0.35, 0.7, 0.35],
            scale: [1.1, 0.95, 1.1],
          }}
          transition={{ duration: 5.6, ease: 'easeInOut', repeat: Infinity }}
          className="absolute -inset-44 -z-10 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle at 65% 70%, color-mix(in oklab, #FF3FA8 55%, transparent), transparent 60%)',
          }}
        />

        {/* Wordmark with layered glow — drop-shadow filter wraps the whole
            BrandMark (including the teal accent dot) for a unified bloom. */}
        <div
          style={{
            filter:
              'drop-shadow(0 0 22px color-mix(in oklab, var(--color-accent) 45%, transparent)) drop-shadow(0 0 8px color-mix(in oklab, var(--color-accent) 65%, transparent))',
          }}
        >
          <BrandMark size="xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.7 } }}
          className="text-lg md:text-xl text-[var(--color-text-muted)] tracking-tight max-w-2xl"
          style={{ textShadow: '0 0 16px rgba(94,234,212,0.18)' }}
        >
          Talk to your portfolio.{' '}
          <span
            className="font-semibold"
            style={{
              color: '#FF3FA8',
              textShadow:
                '0 0 16px rgba(255,63,168,0.55), 0 0 4px rgba(255,63,168,0.8)',
            }}
          >
            Trade by voice.
          </span>
        </motion.div>

        {/* Orb with stacked halos — magenta close-in, teal further out */}
        <div className="relative">
          <motion.div
            aria-hidden
            animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.95, 1.18, 0.95] }}
            transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
            className="absolute inset-0 -m-8 rounded-[36px] blur-2xl"
            style={{
              background:
                'radial-gradient(circle, rgba(255,63,168,0.75), transparent 70%)',
            }}
          />
          <motion.div
            aria-hidden
            animate={{ opacity: [0.4, 0.75, 0.4], scale: [1.1, 1.32, 1.1] }}
            transition={{ duration: 4.4, ease: 'easeInOut', repeat: Infinity }}
            className="absolute inset-0 -m-14 rounded-[40px] blur-3xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--color-accent) 60%, transparent), transparent 65%)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { delay: 0.8, duration: 0.55, type: 'spring', stiffness: 240, damping: 18 },
            }}
            // Override --color-loss locally so the orb's dots, border glow,
            // inner radial wash, and focus ring all read as brighter neon
            // pink — without affecting the live app's default loss color.
            style={{ ['--color-loss' as string]: '#FF3FA8' }}
          >
            <VoiceOrb
              state="idle"
              onTap={() => {}}
              size="lg"
              // Brighter hot-pink TAP TO TALK with a soft glow so it pops in
              // the GIF cover. Only the brand-reveal segment overrides this;
              // the live app's "Tap to talk" stays the default muted gray.
              labelStyle={{
                color: '#FF3FA8',
                textShadow:
                  '0 0 14px rgba(255, 63, 168, 0.55), 0 0 4px rgba(255, 63, 168, 0.85)',
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
