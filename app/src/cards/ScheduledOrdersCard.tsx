// Scheduled orders queue — recurring buys, watchlists, price alerts. New
// product surface for the marketing pitch (segment 6 of the B-roll page).

import { Calendar, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface ScheduledOrder {
  id: string
  side: 'buy' | 'sell'
  symbol: string
  amount: number          // dollars
  frequency: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly'
  nextRun: string         // human-readable e.g. "Mon · 9:30 AM ET"
}

export interface ScheduledOrdersCardData {
  kind: 'scheduled'
  orders: ScheduledOrder[]
}

interface Props {
  data: ScheduledOrdersCardData
}

export function ScheduledOrdersCard({ data }: Props) {
  return (
    <Card className="border-[var(--color-accent)]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-[var(--color-accent)]" />
            <CardTitle>Scheduled orders</CardTitle>
          </div>
          <Badge variant="muted" className="text-[10.5px]">
            {data.orders.length} active
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {data.orders.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)]/40 bg-[color-mix(in_oklab,var(--color-bg-2)_50%,transparent)] px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Badge variant={o.side === 'sell' ? 'sell' : 'buy'} className="shrink-0">
                  {o.side.toUpperCase()}
                </Badge>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-[var(--color-text)] truncate">
                    {o.symbol}{' '}
                    <span className="text-[var(--color-text-dim)] font-normal">
                      · ${o.amount.toLocaleString()} {o.frequency.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    <Clock className="size-3" />
                    Next · {o.nextRun}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  'size-1.5 rounded-full shrink-0',
                  'bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)] animate-pulse',
                )}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[10.5px] text-[var(--color-text-dim)]">
          Or say <span className="text-[var(--color-accent)] font-semibold">"add a schedule"</span>
        </div>
      </CardContent>
    </Card>
  )
}
