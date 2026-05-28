// Top market movers, shown on the empty state so the app feels alive before
// the user has talked to the agent. Cards are compact, sparkline-led.

import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useSpotlight } from '@/hooks/use-spotlight'

export function SpotlightSection() {
  const { spotlight, loading, error } = useSpotlight()

  if (error) {
    // Stay silent on error — the empty-state copy below handles the no-data case.
    return null
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[var(--color-accent)]" />
          <div className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-[var(--color-text-dim)]">
            Today's Movers
          </div>
        </div>
        <div className="text-[10px] tracking-wide text-[var(--color-text-dim)] uppercase">
          Live · Paper
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-[14px]" />
            ))
          : spotlight!.items.map((item) => (
              <SpotlightCard
                key={item.symbol}
                symbol={item.symbol}
                price={item.price}
                changePct={item.changePct}
                spark={item.spark}
                category={item.category}
              />
            ))}
      </div>
    </section>
  )
}

interface SpotlightCardProps {
  symbol: string
  price: number
  changePct: number
  spark: number[]
  category: 'gainer' | 'loser'
}

function SpotlightCard({ symbol, price, changePct, spark, category }: SpotlightCardProps) {
  const loss = category === 'loser'
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[14px] p-3',
        'glass transition-all duration-200',
        'hover:border-[var(--color-accent)]/40 hover:-translate-y-0.5',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-400',
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
          {symbol}
        </div>
        <div
          className={cn(
            'flex items-center gap-0.5 text-[10px] font-semibold tnum px-1.5 py-0.5 rounded',
            loss
              ? 'text-[var(--color-loss)] bg-[var(--color-loss)]/10'
              : 'text-[var(--color-accent)] bg-[var(--color-accent)]/10',
          )}
        >
          {loss ? <TrendingDown className="size-2.5" /> : <TrendingUp className="size-2.5" />}
          {loss ? '' : '+'}
          {changePct.toFixed(1)}%
        </div>
      </div>

      {spark.length > 1 ? <MiniSpark points={spark} loss={loss} /> : <div className="h-[40px]" />}

      <div className="mt-2 text-lg font-semibold tracking-tight text-[var(--color-text)] tnum">
        ${price.toFixed(2)}
      </div>
    </div>
  )
}

function MiniSpark({ points, loss }: { points: number[]; loss: boolean }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 160
  const h = 40
  const step = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * h] as const)
  const path = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
  const area = `${path} L${w},${h} L0,${h} Z`
  const color = loss ? '#F472B6' : '#5EEAD4'
  const id = `mini-${loss ? 'l' : 'g'}-${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-10">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }}
      />
    </svg>
  )
}
