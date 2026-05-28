// Scene 2 — Morning Brief (7.4s). Dialog flow:
//   t=0      idle
//   t=180    orb listening (user is about to talk)
//   t=300    USER VO: "Morning. How we looking?" (1.33s)
//   t=1700   orb pivots to speaking
//   t=2000   AGENT VO: "Up twelve eighty-four..." (4.54s)
//           ↳ portfolio card SLAMS in, count-up runs
//   t=6800   orb idle, hold

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PortfolioCard } from '@/cards/PortfolioCard'
import { VoiceOrb, type OrbState } from '@/components/voice-orb'
import { SceneFrame } from '../components/SceneFrame'
import { Caption } from '../components/Caption'
import { LetterCascade } from '../components/LetterCascade'
import { useCountUp } from '../hooks/useCountUp'
import { BRIEF_FIXTURE } from '../fixtures'

interface Props { showCaptions: boolean }

type Stage = 'idle' | 'asking' | 'answering' | 'hold'

const ORB: Record<Stage, OrbState> = {
  idle: 'idle',
  asking: 'listening',
  answering: 'speaking',
  hold: 'idle',
}

const CAPTION: Record<Stage, { text: string; variant: 'user' | 'agent' } | null> = {
  idle: null,
  asking: { text: 'Morning. How we looking?', variant: 'user' },
  answering: { text: 'Up twelve eighty-four across the book.', variant: 'agent' },
  hold: null,
}

export function BriefScene({ showCaptions }: Props) {
  const [stage, setStage] = useState<Stage>('idle')

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('asking'), 180),
      setTimeout(() => setStage('answering'), 1900),
      setTimeout(() => setStage('hold'), 6800),
    ]
    return () => { for (const t of timers) clearTimeout(t) }
  }, [])

  // Count-up only starts when the agent begins to speak.
  const countUpKey = stage === 'answering' || stage === 'hold' ? 'go' : 'pre'
  const dollars = useCountUp({
    to: stage === 'idle' || stage === 'asking' ? 0 : BRIEF_FIXTURE.dayPL,
    durationMs: 900, decimals: 0, triggerKey: countUpKey,
  })
  const pct = useCountUp({
    to: stage === 'idle' || stage === 'asking' ? 0 : BRIEF_FIXTURE.dayPLPct,
    durationMs: 900, decimals: 2, triggerKey: countUpKey,
  })

  const showCard = stage === 'answering' || stage === 'hold'
  const cap = CAPTION[stage]

  return (
    <SceneFrame transition="push-up">
      <div className="flex flex-col items-center gap-6 max-w-5xl w-full">
        {/* Orb anchors the conversation — its state tells you who's talking */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1, scale: 1,
            transition: { duration: 0.35, type: 'spring', stiffness: 240, damping: 18 },
          }}
        >
          <VoiceOrb state={ORB[stage]} onTap={() => {}} size="sm" />
        </motion.div>

        <motion.div
          initial={{ x: 0 }}
          animate={{ x: -10, transition: { duration: 7, ease: 'linear' } }}
          className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] items-center gap-10 w-full"
        >
          {/* Left — headline + hero stat (revealed when agent speaks) */}
          <div className="flex flex-col items-start gap-3 min-h-[170px]">
            <div className="text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-accent)] font-semibold">
              <LetterCascade text="Morning brief" stagger={0.018} />
            </div>
            <AnimatePresence>
              {showCard && (
                <motion.div
                  key="stat"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.35 } }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-baseline gap-3">
                    <motion.div
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, transition: { duration: 0.4, type: 'spring', stiffness: 280, damping: 18 } }}
                      className="text-6xl md:text-7xl font-semibold tracking-tight text-[var(--color-accent)] tnum"
                      style={{ textShadow: '0 0 28px color-mix(in oklab, var(--color-accent) 50%, transparent)' }}
                    >
                      +${dollars.toLocaleString()}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
                      className="text-2xl md:text-3xl font-medium text-[var(--color-accent)]/80 tnum"
                    >
                      +{pct.toFixed(2)}%
                    </motion.div>
                  </div>
                  <div className="text-base text-[var(--color-text-muted)] max-w-md leading-relaxed">
                    NVDA leading on the cloud capex print.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — portfolio card slams in synced to agent voice */}
          <div className="w-full max-w-sm justify-self-center md:justify-self-end min-h-[260px]">
            <AnimatePresence>
              {showCard && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, scale: 0.7, rotate: 4 }}
                  animate={{
                    opacity: 1, scale: 1, rotate: 0,
                    transition: { duration: 0.45, type: 'spring', stiffness: 230, damping: 19 },
                  }}
                  className="glow-accent-soft rounded-[14px]"
                >
                  <PortfolioCard data={BRIEF_FIXTURE} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <Caption text={cap?.text} show={showCaptions && !!cap} variant={cap?.variant ?? 'user'} />
    </SceneFrame>
  )
}
