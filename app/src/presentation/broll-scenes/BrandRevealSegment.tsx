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
import { ArrowRight } from 'lucide-react'
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
        // Negative margin-top pulls the focal stack up from dead-center so
        // there's breathing room for the side cards and cube floor below.
        style={{ marginTop: '-24vh' }}
        className="relative flex flex-col items-center gap-9 text-center z-10"
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
              // Hide the built-in "TAP TO TALK" label — the CTA button below
              // takes over that role for the cover.
              labelStyle={{ display: 'none' }}
            />
          </motion.div>
        </div>

        {/* Get Started CTA — teal gradient pill, contrasts the pink orb.
            Navigates to the live agent route. */}
        <motion.button
          type="button"
          onClick={() => { window.location.hash = '#/agent' }}
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { delay: 1.1, duration: 0.55, type: 'spring', stiffness: 240, damping: 20 },
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 cursor-pointer font-semibold"
          style={{
            background:
              'linear-gradient(135deg, #5EEAD4 0%, #22D3EE 100%)',
            color: '#07101F',
            padding: '14px 30px',
            borderRadius: '9999px',
            fontSize: '15px',
            letterSpacing: '0.01em',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow:
              '0 0 38px color-mix(in oklab, var(--color-accent) 55%, transparent), 0 14px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        >
          Get started
          <ArrowRight size={17} strokeWidth={2.5} />
        </motion.button>
      </motion.div>
    </>
  )
}
