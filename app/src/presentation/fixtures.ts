// Mocked card payloads for the marketing presentation. Numbers tuned for
// visual punch (everything green-ish) — this is a trailer, not a fair tape.

import type {
  PortfolioCard as PortfolioCardData,
  TickerCard as TickerCardData,
  TradeCard as TradeCardData,
  FillCard as FillCardData,
} from '@/cards/types'

export const BRIEF_FIXTURE: PortfolioCardData = {
  kind: 'portfolio',
  dayPL: 1284.42,
  dayPLPct: 0.91,
  totalValue: 142083,
  buyingPower: 14238,
  positions: [
    { symbol: 'AAPL', qty: 42, dayPL: 198.4 },
    { symbol: 'NVDA', qty: 30, dayPL: 612.18 },
    { symbol: 'MSFT', qty: 18, dayPL: 124.05 },
    { symbol: 'TSLA', qty: 25, dayPL: -84.21 },
    { symbol: 'BTC/USD', qty: 0.32, dayPL: 434.0 },
  ],
  openOrders: [],
}

// 60-point sparkline trending up, with realistic micro-volatility.
function genSpark(start: number, end: number, n = 60, noise = 0.5): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const trend = start + (end - start) * t
    const wiggle = Math.sin(i * 0.8) * noise + (Math.random() - 0.5) * noise * 0.5
    out.push(+(trend + wiggle).toFixed(2))
  }
  return out
}

export const NVDA_FIXTURE: TickerCardData = {
  kind: 'ticker',
  symbol: 'NVDA',
  company: 'NVIDIA Corp.',
  price: 138.92,
  changePct: 4.92,
  spark: genSpark(132.4, 138.9, 60, 0.7),
  headline: 'Cloud capex beat lifts AI names — Hyperscaler guides higher.',
}

export const TRADE_FIXTURE: TradeCardData = {
  kind: 'trade',
  side: 'buy',
  symbol: 'MSFT',
  qty: 10,
  type: 'market',
  estCost: 4205,
}

export const FILL_PAYLOAD: FillCardData = {
  kind: 'fill',
  side: 'buy',
  symbol: 'MSFT',
  qty: 10,
  avgPrice: 420.5,
}
