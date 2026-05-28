// B-roll segment 5 — Voice trade flow. Compressed re-stage of the trade beat
// without the user-side audio: orb listens → trade card → FILLED card +
// Sonner toast. Auto-loops every ~8s.

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { VoiceOrb, type OrbState } from '@/components/voice-orb'
import { TradeCard } from '@/cards/TradeCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TRADE_FIXTURE, FILL_PAYLOAD } from '../fixtures'

interface Props { loopKey: number }

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
  asking: { text: 'Buy ten Microsoft.', variant: 'user' },
  pending: { text: 'Ten at market. Confirm?', variant: 'agent' },
  confirming: { text: 'Confirm.', variant: 'user' },
  filled: { text: 'Filled.', variant: 'agent' },
}

export function VoiceTradeSegment({ loopKey }: Props) {
  const [stage, setStage] = useState<Stage>('pre')

  useEffect(() => {
    setStage('pre')
    const timers = [
      setTimeout(() => setStage('asking'), 200),
      setTimeout(() => setStage('pending'), 1400),
      setTimeout(() => setStage('confirming'), 3800),
      setTimeout(() => {
        setStage('filled')
        toast.success(
          `Filled · ${FILL_PAYLOAD.qty} ${FILL_PAYLOAD.symbol} @ $${FILL_PAYLOAD.avgPrice.toFixed(2)}`,
          { description: 'Position opened.' },
        )
      }, 5000),
    ]
    return () => { for (const t of timers) clearTimeout(t) }
  }, [loopKey])

  const cap = CAPTION_BY_STAGE[stage]

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, type: 'spring', stiffness: 240, damping: 18 } }}
      >
        <VoiceOrb state={ORB_BY_STAGE[stage]} onTap={() => {}} size="md" />
      </motion.div>

      {cap && (
        <motion.div
          key={`cap-${stage}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium tracking-tight backdrop-blur-md ${
            cap.variant === 'agent'
              ? 'bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-text)] border border-[var(--color-accent)]/30'
              : 'bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] text-[var(--color-text)] border border-[var(--color-border)]/50'
          }`}
        >
          <span className="opacity-70 mr-2 text-[10px] uppercase tracking-[0.18em]">
            {cap.variant === 'user' ? 'You' : 'Agent'}
          </span>
          {cap.text}
        </motion.div>
      )}

      <div className="w-full min-h-[210px] flex items-start justify-center">
        <AnimatePresence mode="wait">
          {(stage === 'pending' || stage === 'confirming') && (
            <motion.div
              key="trade"
              initial={{ opacity: 0, y: 24, scale: 0.88 }}
              animate={{
                opacity: 1, y: 0, scale: 1,
                transition: { duration: 0.4, type: 'spring', stiffness: 260, damping: 20 },
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
              initial={{ opacity: 0, scale: 0.78, rotate: -2 }}
              animate={{
                opacity: 1, scale: 1, rotate: 0,
                transition: { duration: 0.4, type: 'spring', stiffness: 280, damping: 18 },
              }}
              className="w-full"
            >
              <FilledMiniCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FilledMiniCard() {
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
