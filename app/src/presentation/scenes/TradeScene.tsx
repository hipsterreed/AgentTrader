// Scene 4 — Voice trade (10.3s). Hero moment, full 4-line dialog:
//   t=0      idle
//   t=180    orb listening
//   t=300    USER VO: "Buy ten shares of Microsoft." (1.69s)
//   t=2100   orb pivots to speaking; trade card slams in
//   t=2200   AGENT VO: "Ten Microsoft at market, about forty-two oh-five. Confirm?" (3.55s)
//   t=5900   orb back to listening
//   t=6000   USER VO: "Confirm." (0.74s)
//   t=6900   orb speaking; trade card swaps to FILLED, Sonner toast fires
//   t=7000   AGENT VO: "Filled — ten at four-twenty fifty." (2.15s)
//   t=9300   hold

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { VoiceOrb, type OrbState } from '@/components/voice-orb'
import { TradeCard } from '@/cards/TradeCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SceneFrame } from '../components/SceneFrame'
import { Caption } from '../components/Caption'
import { TRADE_FIXTURE, FILL_PAYLOAD } from '../fixtures'

interface Props { showCaptions: boolean }

type Stage = 'pre' | 'asking' | 'pending' | 'confirming' | 'filled'

const ORB_BY_STAGE: Record<Stage, OrbState> = {
  pre: 'idle',
  asking: 'listening',
  pending: 'speaking',
  confirming: 'listening',
  filled: 'speaking',
}

const CAPTION_BY_STAGE: Record<Stage, { text: string; variant: 'user' | 'agent' } | null> = {
  pre: null,
  asking: { text: 'Buy ten shares of Microsoft.', variant: 'user' },
  pending: { text: 'Ten MSFT at market. Confirm?', variant: 'agent' },
  confirming: { text: 'Confirm.', variant: 'user' },
  filled: { text: 'Filled at four-twenty fifty.', variant: 'agent' },
}

export function TradeScene({ showCaptions }: Props) {
  const [stage, setStage] = useState<Stage>('pre')

  // Beat schedule matches vo-clips.ts delays so audio onsets align with stages.
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('asking'), 180),
      setTimeout(() => setStage('pending'), 2100),
      setTimeout(() => setStage('confirming'), 5900),
      setTimeout(() => {
        setStage('filled')
        toast.success(
          `Filled · ${FILL_PAYLOAD.qty} ${FILL_PAYLOAD.symbol} @ $${FILL_PAYLOAD.avgPrice.toFixed(2)}`,
          { description: 'Position opened.' },
        )
      }, 6900),
    ]
    return () => { for (const t of timers) clearTimeout(t) }
  }, [])

  const cap = CAPTION_BY_STAGE[stage]

  return (
    <SceneFrame transition="push-left">
      <div className="flex flex-col items-center gap-7 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, type: 'spring', stiffness: 240, damping: 18 } }}
        >
          <VoiceOrb state={ORB_BY_STAGE[stage]} onTap={() => {}} size="md" />
        </motion.div>

        <div className="w-full min-h-[220px] flex items-start justify-center">
          <AnimatePresence mode="wait">
            {(stage === 'pending' || stage === 'confirming') && (
              <motion.div
                key="trade"
                initial={{ opacity: 0, y: 32, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.45, type: 'spring', stiffness: 260, damping: 20 },
                }}
                exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.18 } }}
                className="w-full"
              >
                <TradeCard data={TRADE_FIXTURE} />
              </motion.div>
            )}

            {stage === 'filled' && (
              <motion.div
                key="filled"
                initial={{ opacity: 0, scale: 0.75, rotate: -2 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  transition: { duration: 0.4, type: 'spring', stiffness: 280, damping: 18 },
                }}
                className="w-full"
              >
                <FilledCard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Caption text={cap?.text} show={showCaptions && !!cap} variant={cap?.variant ?? 'user'} />
    </SceneFrame>
  )
}

function FilledCard() {
  return (
    <Card className="border-[var(--color-accent)]/60 glow-accent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="gain" className="flex items-center gap-1">
            <Check className="size-3" />
            FILLED
          </Badge>
          <span className="text-[10.5px] tracking-[0.18em] uppercase text-[var(--color-text-dim)] font-medium">
            Position opened
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-base font-semibold text-[var(--color-text)] tracking-tight">
          {FILL_PAYLOAD.qty} {FILL_PAYLOAD.symbol} @ ${FILL_PAYLOAD.avgPrice.toFixed(2)}
        </div>
        <div className="text-xs text-[var(--color-text-dim)] tnum mt-1">
          Avg fill · ${(FILL_PAYLOAD.qty * FILL_PAYLOAD.avgPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} settled
        </div>
      </CardContent>
    </Card>
  )
}
