// Scene 3 — Ticker pull (7s). Dialog flow:
//   t=0      idle
//   t=180    orb listening
//   t=300    USER VO: "What's Nvidia doing?" (1.61s)
//   t=2000   orb pivots to speaking; ticker card slams in with sparkline wipe
//   t=2100   AGENT VO: "Up four-nine on the day..." (3.96s)
//   t=6500   hold

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { TickerCard } from '@/cards/TickerCard'
import { VoiceOrb, type OrbState } from '@/components/voice-orb'
import { SceneFrame } from '../components/SceneFrame'
import { Caption } from '../components/Caption'
import { LetterCascade } from '../components/LetterCascade'
import { NVDA_FIXTURE } from '../fixtures'

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
  asking: { text: "What's Nvidia doing?", variant: 'user' },
  answering: { text: "Up four-nine. You're sitting on six-twelve.", variant: 'agent' },
  hold: null,
}

export function TickerScene({ showCaptions }: Props) {
  const [stage, setStage] = useState<Stage>('idle')

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('asking'), 180),
      setTimeout(() => setStage('answering'), 2000),
      setTimeout(() => setStage('hold'), 6300),
    ]
    return () => { for (const t of timers) clearTimeout(t) }
  }, [])

  const showCard = stage === 'answering' || stage === 'hold'
  const cap = CAPTION[stage]

  return (
    <SceneFrame transition="zoom-in">
      <div className="flex flex-col items-center gap-5 w-full max-w-md">
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
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } }}
          className="text-[10.5px] uppercase tracking-[0.32em] text-[var(--color-accent-2)] font-semibold flex items-center gap-2"
        >
          <span className="size-1.5 rounded-full bg-[var(--color-accent)] animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
          <LetterCascade text="Live tape · NYSE" stagger={0.014} />
        </motion.div>

        {/* Card holds space while the user is asking; slams in for the agent */}
        <div className="w-full min-h-[210px] flex items-start justify-center">
          <AnimatePresence>
            {showCard && (
              <motion.div
                key="card"
                initial={{ opacity: 0, scale: 0.72, y: 28 }}
                animate={{
                  opacity: 1, scale: 1, y: 0,
                  transition: { duration: 0.45, type: 'spring', stiffness: 240, damping: 19 },
                }}
                className="w-full glow-accent-soft rounded-[14px]"
              >
                <motion.div
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{
                    clipPath: 'inset(0 0% 0 0)',
                    transition: { delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  }}
                >
                  <TickerCard data={NVDA_FIXTURE} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Caption text={cap?.text} show={showCaptions && !!cap} variant={cap?.variant ?? 'user'} />
    </SceneFrame>
  )
}
