// Desktop-only portfolio sidebar. Hydrates from /api/portfolio on mount; updates
// live when the agent fetches positions (SSE card). Degrades gracefully when
// the service is offline — keeps skeletons and shows a small hint.

import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign, WifiOff, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { OpenOrder } from '@/cards/types'
import type { PortfolioSnapshot } from '@/hooks/use-portfolio'
import { cn } from '@/lib/utils'

const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

interface Props {
  snapshot?: PortfolioSnapshot
  loading: boolean
  error?: string
  onDropOrder?: (id: string) => void
}

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

export function PortfolioSidebar({ snapshot, loading, error, onDropOrder }: Props) {
  const isUp = (snapshot?.dayPL ?? 0) >= 0
  const offline = !loading && !snapshot && !!error
  const openOrders = snapshot?.openOrders ?? []

  return (
    <aside className="hidden md:flex w-[280px] lg:w-[300px] shrink-0 flex-col border-r border-[var(--color-border)]/40 bg-[var(--color-bg-1)]/30 backdrop-blur-md">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-[var(--color-text-dim)]">
          Portfolio
        </div>
        {offline && (
          <div
            className="flex items-center gap-1 text-[10px] text-[var(--color-warn)]"
            title={error}
          >
            <WifiOff className="size-3" /> offline
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-5">
        {/* Hero day P&L */}
        <div className="mb-5">
          {snapshot ? (
            <>
              <div
                className={cn(
                  'text-3xl font-semibold tnum tracking-tight',
                  isUp ? 'text-[var(--color-accent)]' : 'text-[var(--color-loss)]',
                )}
              >
                {fmtMoney(snapshot.dayPL, true)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] tnum mt-1 flex items-center gap-1">
                {isUp ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {snapshot.dayPLPct >= 0 ? '+' : ''}
                {snapshot.dayPLPct.toFixed(2)}% today
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </>
          )}
        </div>

        <Separator />

        {/* Quick stats */}
        <div className="py-4 space-y-2.5">
          <StatRow
            icon={<Wallet className="size-3.5" />}
            label="Total value"
            value={snapshot ? fmtMoney(snapshot.totalValue) : '—'}
          />
          <StatRow
            icon={<CircleDollarSign className="size-3.5" />}
            label="Buying power"
            value={snapshot ? fmtMoney(snapshot.buyingPower) : '—'}
          />
        </div>

        <Separator />

        {/* Positions */}
        <div className="py-4">
          <div className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-[var(--color-text-dim)] mb-3">
            Positions
          </div>
          {!snapshot ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : snapshot.positions.length === 0 ? (
            <div className="text-xs text-[var(--color-text-dim)] italic leading-relaxed">
              No open positions yet — ask the agent to find ideas.
            </div>
          ) : (
            <div className="space-y-1.5">
              {snapshot.positions.map((p) => {
                const up = p.dayPL >= 0
                return (
                  <div
                    key={p.symbol}
                    className="group flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {p.symbol}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-dim)] tnum">
                        {fmtQty(p.qty, p.symbol)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'text-xs tnum font-medium',
                        up ? 'text-[var(--color-accent)]' : 'text-[var(--color-loss)]',
                      )}
                    >
                      {fmtMoney(p.dayPL, true)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {openOrders.length > 0 && (
          <>
            <Separator />
            <div className="py-4">
              <div className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-[var(--color-text-dim)] mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Pending</span>
                  <span className="text-[var(--color-accent-2)] tnum">· {openOrders.length}</span>
                </div>
                {openOrders.some((o) => o.estValue != null) && (
                  <span className="text-[var(--color-text-muted)] tnum normal-case tracking-normal">
                    {fmtMoney(
                      openOrders.reduce((sum, o) => sum + (o.estValue ?? 0), 0),
                    )}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {openOrders.map((o) => (
                  <PendingRow
                    key={o.id}
                    order={o}
                    onCancelled={() => onDropOrder?.(o.id)}
                  />
                ))}
              </div>
              {!snapshot?.marketOpen && (
                <div className="mt-3 text-[10px] text-[var(--color-text-dim)] italic">
                  queued for 9:30 ET open
                </div>
              )}
            </div>
          </>
        )}
      </ScrollArea>

      <div className="px-5 py-3 border-t border-[var(--color-border)]/40 flex items-center justify-between text-[10px] tracking-wide text-[var(--color-text-dim)]">
        <span>
          {snapshot?.marketOpen ? 'NYSE OPEN' : snapshot ? 'NYSE CLOSED' : '—'}
        </span>
        <span className="tnum">PAPER</span>
      </div>
    </aside>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        {icon}
        {label}
      </div>
      <div className="text-xs tnum text-[var(--color-text)] font-medium">{value}</div>
    </div>
  )
}

function fmtOrderSize(o: OpenOrder): string {
  if (o.notional && !o.qty) return `$${o.notional.toLocaleString()}`
  if (isCrypto(o.symbol)) {
    const base = o.symbol.replace(/\/?USD[TC]?$/, '') || o.symbol
    return `${o.qty} ${base}`
  }
  return `${o.qty}`
}

function fmtOrderPrice(o: OpenOrder): string {
  if (o.type === 'market') return '@ MKT'
  return o.limitPrice != null ? `@ $${o.limitPrice}` : '@ LMT'
}

function PendingRow({
  order,
  onCancelled,
}: {
  order: OpenOrder
  onCancelled: () => void
}) {
  const [cancelling, setCancelling] = useState(false)
  const sideColor = order.side === 'buy' ? 'text-[var(--color-accent)]' : 'text-[var(--color-loss)]'

  async function cancel() {
    if (cancelling) return
    setCancelling(true)
    // Optimistic — remove from the list before the broker confirms.
    onCancelled()
    try {
      await fetch(`${SERVICE_URL}/api/orders/${order.id}`, { method: 'DELETE' })
    } catch {
      /* next portfolio snapshot will reconcile */
    }
  }

  return (
    <div className="group flex items-center justify-between rounded-md border-l-2 border-[var(--color-accent-2)]/40 bg-white/[0.015] px-2 py-1.5 hover:bg-white/[0.04] transition-colors">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          {order.symbol}
        </span>
        <span className="text-[10px] text-[var(--color-text-dim)] tnum truncate">
          <span className={cn('font-medium', sideColor)}>
            {order.side.toUpperCase()}
          </span>
          {' '}{fmtOrderSize(order)} {fmtOrderPrice(order)}
        </span>
      </div>
      <div className="ml-2 flex items-center gap-1.5">
        {order.estValue != null && (
          <span className="text-xs tnum text-[var(--color-text-muted)] font-medium">
            {fmtMoney(order.estValue)}
          </span>
        )}
        <button
          type="button"
          onClick={cancel}
          disabled={cancelling}
          aria-label={`Cancel ${order.side} ${order.symbol}`}
          className="inline-flex size-5 items-center justify-center rounded text-[var(--color-text-dim)] opacity-0 hover:bg-white/[0.06] hover:text-[var(--color-loss)] group-hover:opacity-100 transition-opacity disabled:opacity-40 cursor-pointer"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  )
}
