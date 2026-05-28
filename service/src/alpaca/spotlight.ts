// Spotlight: a small curated set of "what's moving today" that the frontend
// renders on app load so the user has something to engage with immediately.
// Pulls top gainers + losers from Alpaca's screener and enriches each with a
// 30-day close-price spark so the cards have a real trend, not just a number.

import { marketData } from "./client";

interface MoverRaw {
  symbol: string;
  percent_change?: number;
  change?: number;
  price?: number;
}

interface MoversResponse {
  gainers?: MoverRaw[];
  losers?: MoverRaw[];
  last_updated?: string;
}

export interface SpotlightItem {
  symbol: string;
  price: number;
  changePct: number;
  spark: number[]; // close prices, oldest → newest
  category: "gainer" | "loser";
}

export interface Spotlight {
  items: SpotlightItem[];
  asOf: string;
}

const TOP_N = 3;

async function fetchSpark(symbol: string): Promise<number[]> {
  try {
    const b = (await marketData.bars(symbol, {
      timeframe: "1Day",
      limit: 30,
    })) as { bars?: Array<{ c?: number }> };
    return (b.bars ?? [])
      .map((bar) => Number(bar.c ?? 0))
      .filter((n) => n > 0);
  } catch {
    return [];
  }
}

export async function fetchSpotlight(): Promise<Spotlight> {
  const movers = (await marketData.movers({ top: 10 })) as MoversResponse;

  // Take top N gainers and top N losers (Alpaca already returns sorted).
  const gainers = (movers.gainers ?? []).slice(0, TOP_N);
  const losers = (movers.losers ?? []).slice(0, TOP_N);

  const raw: Array<{ r: MoverRaw; category: "gainer" | "loser" }> = [
    ...gainers.map((r) => ({ r, category: "gainer" as const })),
    ...losers.map((r) => ({ r, category: "loser" as const })),
  ];

  // Fetch sparks in parallel — ~150ms total regardless of count.
  const items: SpotlightItem[] = await Promise.all(
    raw.map(async ({ r, category }) => ({
      symbol: String(r.symbol).toUpperCase(),
      price: Number(r.price ?? 0),
      changePct: Number(r.percent_change ?? 0),
      spark: await fetchSpark(String(r.symbol)),
      category,
    })),
  );

  return {
    items,
    asOf: movers.last_updated ?? new Date().toISOString(),
  };
}
