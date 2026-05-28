// Portfolio snapshot composition — shared between the tool dispatcher (emits a
// card after get_all_positions) and the /api/portfolio HTTP endpoint (so the
// sidebar can populate on app load, not just after the agent fetches).

import { marketData, trading } from "./client";

export interface OpenOrder {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  notional?: number;
  type: "market" | "limit";
  limitPrice?: number;
  estValue?: number;
  status: string;
  submittedAt: string;
}

export interface PortfolioSnapshot {
  dayPL: number;
  dayPLPct: number;
  totalValue: number;
  buyingPower: number;
  positions: Array<{ symbol: string; qty: number; dayPL: number }>;
  openOrders: OpenOrder[];
  marketOpen: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function fetchPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const [acc, pos, clock, orders] = await Promise.all([
    trading.account() as Promise<Record<string, string>>,
    trading.positions() as Promise<
      Array<{
        symbol: string;
        qty: string;
        unrealized_intraday_pl?: string;
      }>
    >,
    trading.clock() as Promise<{ is_open?: boolean }>,
    trading.orders({ status: "open", limit: 20 }) as Promise<
      Array<{
        id: string;
        symbol: string;
        side: "buy" | "sell";
        qty?: string | null;
        notional?: string | null;
        type: string;
        limit_price?: string | null;
        status: string;
        submitted_at: string;
      }>
    >,
  ]);

  const equity = Number(acc.equity ?? 0);
  const lastEquity = Number(acc.last_equity ?? equity);
  const dayPL = equity - lastEquity;
  const dayPLPct = lastEquity ? (dayPL / lastEquity) * 100 : 0;

  const trimmedOrders = orders.slice(0, 8);

  // Look up latest trade once per unique symbol so we can estimate notional
  // value for market orders. Best-effort: a failed quote leaves estValue
  // undefined, the UI just hides the slot for that row.
  const uniqueSymbols = [...new Set(trimmedOrders.map((o) => o.symbol))];
  const priceMap = new Map<string, number>();
  await Promise.all(
    uniqueSymbols.map(async (sym) => {
      try {
        const t = (await marketData.latestTrade(sym)) as { trade?: { p?: number } };
        if (t.trade?.p) priceMap.set(sym, t.trade.p);
      } catch {
        /* skip — estValue stays undefined */
      }
    }),
  );

  function estValueFor(o: (typeof trimmedOrders)[number]): number | undefined {
    if (o.notional) return Number(o.notional);
    const qty = o.qty ? Number(o.qty) : 0;
    if (!qty) return undefined;
    if (o.type === "limit" && o.limit_price) return round2(qty * Number(o.limit_price));
    const px = priceMap.get(o.symbol);
    return px ? round2(qty * px) : undefined;
  }

  return {
    dayPL: round2(dayPL),
    dayPLPct: round2(dayPLPct),
    totalValue: round2(equity),
    buyingPower: round2(Number(acc.buying_power ?? 0)),
    positions: pos.slice(0, 8).map((p) => ({
      symbol: String(p.symbol).toUpperCase(),
      qty: Number(p.qty),
      dayPL: round2(Number(p.unrealized_intraday_pl ?? 0)),
    })),
    openOrders: trimmedOrders.map((o) => ({
      id: o.id,
      symbol: String(o.symbol).toUpperCase(),
      side: o.side,
      qty: o.qty ? Number(o.qty) : 0,
      notional: o.notional ? Number(o.notional) : undefined,
      type: o.type === "limit" ? "limit" : "market",
      limitPrice: o.limit_price ? Number(o.limit_price) : undefined,
      estValue: estValueFor(o),
      status: o.status,
      submittedAt: o.submitted_at,
    })),
    marketOpen: Boolean(clock.is_open),
  };
}
