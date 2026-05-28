// AI recommendation card — surfaces an opinionated trade suggestion with
// reasoning + confidence + accept/decline actions. New product surface for
// the marketing pitch (segment 4 of the B-roll page).

import { Sparkles, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export interface RecommendationCardData {
  kind: 'recommendation'
  side: 'buy' | 'sell' | 'trim'
  symbol: string
  qty: number
  estCost: number
  confidence: number      // 0..1
  thesis: string
  catalysts?: string[]
}

interface Props {
  data: RecommendationCardData
}

const SIDE_LABEL: Record<RecommendationCardData['side'], string> = {
  buy: 'BUY',
  sell: 'SELL',
  trim: 'TRIM',
}

export function RecommendationCard({ data }: Props) {
  const confPct = Math.round(data.confidence * 100)
  const sideVariant = data.side === 'sell' || data.side === 'trim' ? 'sell' : 'buy'

  return (
    <Card className="border-[var(--color-accent)]/40 glow-accent-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[var(--color-accent)]" />
            <span className="text-[10.5px] tracking-[0.18em] uppercase text-[var(--color-text-dim)] font-medium">
              AI recommendation
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--color-accent)] font-semibold tnum">
            <TrendingUp className="size-3" />
            {confPct}% conf
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2.5 mb-1.5">
          <Badge variant={sideVariant}>{SIDE_LABEL[data.side]}</Badge>
          <span className="text-base font-semibold tracking-tight text-[var(--color-text)]">
            {data.symbol}
          </span>
          <span className="text-xs text-[var(--color-text-dim)] tnum">
            +{data.qty} sh · ~${data.estCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-2 italic">
          "{data.thesis}"
        </p>

        {data.catalysts && data.catalysts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.catalysts.map((c) => (
              <span
                key={c}
                className="text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-accent-2)] bg-[color-mix(in_oklab,var(--color-accent)_10%,transparent)] border border-[var(--color-accent)]/20 rounded-full px-2 py-0.5"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 items-stretch">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Decline
          </Button>
          <Button size="sm" className="flex-1">
            Accept
          </Button>
        </div>
        <div className="text-center text-[10.5px] text-[var(--color-text-dim)]">
          Or say <span className="text-[var(--color-accent)] font-semibold">"go ahead"</span>
        </div>
      </CardFooter>
    </Card>
  )
}
