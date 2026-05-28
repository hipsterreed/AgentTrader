// State machine for the card stack. Translates raw SSE events into renderable
// component state.
//
// Rules:
// - portfolio: latest replaces previous (only shown inline on mobile/empty-state)
// - ticker: latest per symbol; max 4 visible
// - trade: one at a time; 'clear' event dismisses it; 'fill' also dismisses
// - fill: sonner toast (not a rendered component) — auto-dismisses

import { useEffect, useMemo, useReducer } from 'react'
import { toast } from 'sonner'
import type {
  Card,
  PortfolioCard as PortfolioCardData,
  TickerCard as TickerCardData,
  TradeCard as TradeCardData,
} from './types'
import { TickerCard } from './TickerCard'
import { PortfolioCard } from './PortfolioCard'
import { TradeCard } from './TradeCard'
import { SpotlightSection } from './SpotlightSection'

interface State {
  portfolio?: PortfolioCardData
  tickers: TickerCardData[]
  trade?: TradeCardData
}

type Action =
  | { type: 'card'; card: Card }
  | { type: 'clear-trade' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'card': {
      const c = action.card
      switch (c.kind) {
        case 'portfolio':
          return { ...state, portfolio: c }
        case 'ticker': {
          const filtered = state.tickers.filter((t) => t.symbol !== c.symbol)
          return { ...state, tickers: [c, ...filtered].slice(0, 4) }
        }
        case 'trade':
          return { ...state, trade: c }
        case 'fill': {
          const sign = c.side === 'buy' ? 'Filled' : 'Sold'
          const price = c.avgPrice ? ` @ $${c.avgPrice.toFixed(2)}` : ''
          toast.success(`${sign} · ${c.qty} ${c.symbol}${price}`, {
            description: c.side === 'buy' ? 'Position opened.' : 'Position reduced.',
          })
          return { ...state, trade: undefined }
        }
        case 'clear':
          return { ...state, trade: undefined }
        default:
          return state
      }
    }
    case 'clear-trade':
      return { ...state, trade: undefined }
  }
}

interface Props {
  cards: Card[]
  /** When true (mobile / no sidebar), portfolio card renders inline in the feed. */
  showPortfolioInFeed?: boolean
}

export function CardFeed({ cards, showPortfolioInFeed = true }: Props) {
  const [state, dispatch] = useReducer(reducer, { tickers: [] })

  // Replay each new card event into the state machine.
  const lastSeen = useMemo(() => ({ idx: 0 }), [])
  useEffect(() => {
    for (let i = lastSeen.idx; i < cards.length; i++) {
      dispatch({ type: 'card', card: cards[i] })
    }
    lastSeen.idx = cards.length
  }, [cards, lastSeen])

  const empty = !state.tickers.length && !state.trade && (!showPortfolioInFeed || !state.portfolio)

  return (
    <div className="flex flex-col gap-3 px-4 md:px-6 py-4 pb-40">
      {empty && (
        <>
          <SpotlightSection />
          <div className="mt-4 text-center">
            <div className="text-sm text-[var(--color-text-muted)] font-medium mb-0.5">
              Ready when you are.
            </div>
            <div className="text-xs text-[var(--color-text-dim)] max-w-[36ch] mx-auto leading-relaxed">
              Tap the orb and ask about anything on this board — or your own book.
            </div>
          </div>
        </>
      )}

      {state.tickers.map((t) => <TickerCard key={t.symbol} data={t} />)}

      {showPortfolioInFeed && state.portfolio && <PortfolioCard data={state.portfolio} />}

      {state.trade && (
        <TradeCard
          data={state.trade}
          onCancel={() => dispatch({ type: 'clear-trade' })}
        />
      )}
    </div>
  )
}
