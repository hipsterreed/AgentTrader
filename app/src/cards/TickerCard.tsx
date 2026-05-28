import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TickerCard as TickerCardData } from './types'

interface Props { data: TickerCardData }

export function TickerCard({ data }: Props) {
  const loss = data.changePct < 0
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {data.symbol}
            </div>
            <div className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
              {data.company || data.symbol}
            </div>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium tnum',
              loss ? 'text-[var(--color-loss)]' : 'text-[var(--color-accent)]',
            )}
          >
            {loss ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
            {loss ? '' : '+'}
            {data.changePct.toFixed(2)}%
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-[var(--color-text)] tnum">
          ${data.price.toFixed(2)}
        </div>
        {data.spark && data.spark.length > 1 && (
          <Sparkline points={data.spark} loss={loss} />
        )}
        {data.headline && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]/40 text-xs text-[var(--color-text-muted)] leading-relaxed">
            {data.headline}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Sparkline({ points, loss }: { points: number[]; loss: boolean }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 200
  const h = 44
  const step = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h] as const)
  const path = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const area = `${path} L${w},${h} L0,${h} Z`
  const color = loss ? '#F472B6' : '#5EEAD4'
  const id = `sg-${loss ? 'l' : 'g'}-${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-11 mt-3"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </svg>
  )
}
