// In-feed portfolio card — used on mobile (no sidebar) or when the agent
// explicitly briefs the user. Same data as the sidebar, denser layout.

import { RotateCw } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { PortfolioCard as PortfolioCardData } from './types'

interface Props { data: PortfolioCardData }

function fmtMoney(n: number, withSign = false): string {
  const abs = Math.abs(n)
  const sign = withSign && n >= 0 ? '+' : n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}k`
  if (abs < 10) return `${sign}$${abs.toFixed(2)}`
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// Alpaca returns crypto position symbols as `BTCUSD`/`ETHUSD` (no slash).
function isCrypto(symbol: string): boolean {
  return symbol.includes('/') || /USD[TC]?$/.test(symbol)
}

function fmtQty(qty: number, symbol: string): string {
  if (isCrypto(symbol)) {
    const base = symbol.replace(/\/?USD[TC]?$/, '') || symbol
    const formatted =
      qty >= 1000 ? qty.toFixed(0)
        : qty >= 1 ? qty.toFixed(3)
          : qty >= 0.01 ? qty.toFixed(4)
            : qty.toFixed(6)
    return `${formatted} ${base}`
  }
  return `${qty.toLocaleString(undefined, { maximumFractionDigits: 0 })} sh`
}

export function PortfolioCard({ data }: Props) {
  const isUp = data.dayPL >= 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Donut pct={data.dayPLPct} />
          <div className="flex-1 space-y-1.5">
            <Row k="Day P&L" v={fmtMoney(data.dayPL, true)} cls={isUp ? 'gain' : 'loss'} />
            <Row k="Total value" v={fmtMoney(data.totalValue)} />
            <Row k="Buying power" v={fmtMoney(data.buyingPower)} />
          </div>
        </div>
        {data.positions.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1.5">
              {data.positions.slice(0, 5).map((p) => {
                const up = p.dayPL >= 0
                return (
                  <div
                    key={p.symbol}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[var(--color-text-muted)]">
                      {p.symbol} <span className="text-[var(--color-text-dim)]">· {fmtQty(p.qty, p.symbol)}</span>
                    </span>
                    <span
                      className={cn(
                        'tnum font-medium',
                        up ? 'text-[var(--color-accent)]' : 'text-[var(--color-loss)]',
                      )}
                    >
                      {fmtMoney(p.dayPL, true)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
        {data.openOrders && data.openOrders.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-accent-2)]/90">
            <RotateCw className="size-3" />
            <span>
              {data.openOrders.length} {data.openOrders.length === 1 ? 'order' : 'orders'} queued for open
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ k, v, cls }: { k: string; v: string; cls?: 'gain' | 'loss' }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--color-text-dim)]">{k}</span>
      <span
        className={cn(
          'font-medium tnum',
          cls === 'gain' && 'text-[var(--color-accent)]',
          cls === 'loss' && 'text-[var(--color-loss)]',
          !cls && 'text-[var(--color-text)]',
        )}
      >
        {v}
      </span>
    </div>
  )
}

function Donut({ pct }: { pct: number }) {
  const color = pct >= 0 ? '#5EEAD4' : '#F472B6'
  return (
    <svg viewBox="0 0 36 36" className="size-[72px] shrink-0">
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="rgba(148,163,184,0.15)"
        strokeWidth="3.5"
      />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeDasharray="40 100"
        transform="rotate(-90 18 18)"
        style={{ filter: `drop-shadow(0 0 4px ${color}99)` }}
      />
      <text
        x="18" y="20"
        textAnchor="middle"
        fill="#F1F5F9"
        fontSize="6"
        fontWeight="600"
        fontFamily="Inter"
      >
        {pct >= 0 ? '+' : ''}
        {pct.toFixed(1)}%
      </text>
    </svg>
  )
}
