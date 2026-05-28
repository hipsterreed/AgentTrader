import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import type { TradeCard as TradeCardData } from './types'

interface Props {
  data: TradeCardData
  onConfirm?: () => void
  onCancel?: () => void
}

export function TradeCard({ data, onConfirm, onCancel }: Props) {
  const main = `${data.qty} ${data.symbol} @ ${
    data.type === 'limit' && data.limitPrice ? `$${data.limitPrice.toFixed(2)}` : 'Market'
  }`
  const est = data.estCost
    ? `Est. cost · $${data.estCost.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`
    : 'Awaiting price'

  return (
    <Card className="border-[var(--color-accent)]/40 glow-accent-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant={data.side === 'sell' ? 'sell' : 'buy'}>
            {data.side === 'sell' ? 'SELL' : 'BUY'}
          </Badge>
          <span className="text-[10.5px] tracking-[0.18em] uppercase text-[var(--color-text-dim)] font-medium">
            Awaiting confirmation
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-base font-semibold text-[var(--color-text)] tracking-tight">
          {main}
        </div>
        <div className="text-xs text-[var(--color-text-dim)] tnum mt-1">{est}</div>
      </CardContent>
      <CardFooter className="flex-col gap-2 items-stretch">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="flex-1" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
        <div className="text-center text-[10.5px] text-[var(--color-text-dim)]">
          Or say <span className="text-[var(--color-accent)] font-semibold">"confirm"</span>
        </div>
      </CardFooter>
    </Card>
  )
}
