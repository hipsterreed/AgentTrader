// Mirrors service/src/llm/card-events.ts Card union — kept in lockstep manually
// (small enough that a shared schema would be over-engineering).

export type Card =
  | TickerCard
  | PortfolioCard
  | TradeCard
  | FillCard
  | ClearCard

export interface TickerCard {
  kind: 'ticker'
  symbol: string
  company: string
  price: number
  changePct: number
  spark?: number[]
  headline?: string
}

/** Spotlight items aren't broadcast over SSE — they come from /api/spotlight. */
export interface SpotlightItem {
  symbol: string
  price: number
  changePct: number
  spark: number[]
  category: 'gainer' | 'loser'
}

export interface Spotlight {
  items: SpotlightItem[]
  asOf: string
}

export interface OpenOrder {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  qty: number
  notional?: number
  type: 'market' | 'limit'
  limitPrice?: number
  estValue?: number
  status: string
  submittedAt: string
}

export interface PortfolioCard {
  kind: 'portfolio'
  dayPL: number
  dayPLPct: number
  totalValue: number
  buyingPower: number
  positions: Array<{ symbol: string; qty: number; dayPL: number }>
  openOrders: OpenOrder[]
}

export interface TradeCard {
  kind: 'trade'
  side: 'buy' | 'sell'
  symbol: string
  qty: number
  type: 'market' | 'limit'
  limitPrice?: number
  estCost: number
}

export interface FillCard {
  kind: 'fill'
  side: 'buy' | 'sell'
  symbol: string
  qty: number
  avgPrice: number
}

export interface ClearCard {
  kind: 'clear'
}
