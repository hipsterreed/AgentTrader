// Hydrate the sidebar with the current portfolio on mount; also accepts
// in-band updates from card events so it stays live as the agent trades.

import { useEffect, useState } from 'react'
import type { Card, OpenOrder, PortfolioCard } from '@/cards/types'

const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

export interface PortfolioSnapshot {
  dayPL: number
  dayPLPct: number
  totalValue: number
  buyingPower: number
  positions: Array<{ symbol: string; qty: number; dayPL: number }>
  openOrders: OpenOrder[]
  marketOpen: boolean
}

export function usePortfolio(cards: Card[]): {
  snapshot: PortfolioSnapshot | undefined
  loading: boolean
  error?: string
  dropOpenOrder: (id: string) => void
} {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  // Initial fetch.
  useEffect(() => {
    let cancelled = false
    fetch(`${SERVICE_URL}/api/portfolio`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: PortfolioSnapshot) => {
        if (!cancelled) {
          setSnapshot(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Whenever a portfolio card arrives via SSE (agent fetched positions), update
  // the snapshot in place — same numbers the card shows.
  useEffect(() => {
    if (cards.length === 0) return
    const latestPortfolio = [...cards]
      .reverse()
      .find((c) => c.kind === 'portfolio') as PortfolioCard | undefined
    if (!latestPortfolio) return
    setSnapshot((prev) => ({
      ...prev,
      marketOpen: prev?.marketOpen ?? false,
      dayPL: latestPortfolio.dayPL,
      dayPLPct: latestPortfolio.dayPLPct,
      totalValue: latestPortfolio.totalValue,
      buyingPower: latestPortfolio.buyingPower,
      positions: latestPortfolio.positions,
      openOrders: latestPortfolio.openOrders ?? [],
    }))
  }, [cards])

  // Optimistic remove for tap-to-cancel from the sidebar. The next portfolio
  // snapshot will reconcile if the broker rejected the cancel.
  function dropOpenOrder(id: string) {
    setSnapshot((prev) =>
      prev ? { ...prev, openOrders: prev.openOrders.filter((o) => o.id !== id) } : prev,
    )
  }

  return { snapshot, loading, error, dropOpenOrder }
}
