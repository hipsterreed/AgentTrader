// e2e: raw REST wrapper hits real Alpaca paper endpoints.
// Read-only — no orders placed here.

import { describe, expect, it } from "bun:test";
import { trading, marketData, news, verifyCredentials } from "../src/alpaca/client";

describe("alpaca client (e2e, paper)", () => {
  it("verifyCredentials returns the paper account number", async () => {
    const acc = await verifyCredentials();
    expect(acc.account_number).toBeString();
    expect(acc.account_number.length).toBeGreaterThan(4);
  });

  it("trading.account returns the expected shape", async () => {
    const acc = (await trading.account()) as Record<string, string>;
    expect(acc.account_number).toBeString();
    expect(acc.equity).toBeString(); // alpaca returns numbers as strings
    expect(acc.buying_power).toBeString();
    // sanity: equity is a parseable number > 0 on a funded paper account
    expect(Number(acc.equity)).toBeGreaterThan(0);
  });

  it("trading.positions returns an array (may be empty)", async () => {
    const positions = (await trading.positions()) as unknown[];
    expect(Array.isArray(positions)).toBe(true);
  });

  it("trading.clock tells us if the market is open", async () => {
    const clock = (await trading.clock()) as { is_open: boolean; timestamp: string };
    expect(typeof clock.is_open).toBe("boolean");
    expect(clock.timestamp).toBeString();
  });

  it("trading.asset(SPY) returns a valid, tradable asset", async () => {
    const asset = (await trading.asset("SPY")) as {
      symbol: string;
      tradable: boolean;
      class: string;
    };
    expect(asset.symbol).toBe("SPY");
    expect(asset.tradable).toBe(true);
  });

  it("marketData.snapshot(SPY) returns price-bearing fields", async () => {
    const snap = (await marketData.snapshot("SPY")) as {
      latestTrade?: { p?: number };
      latestQuote?: { ap?: number; bp?: number };
      dailyBar?: { c?: number };
    };
    // At least one of these should yield a positive price.
    const p =
      snap.latestTrade?.p ?? snap.latestQuote?.ap ?? snap.dailyBar?.c ?? 0;
    expect(p).toBeGreaterThan(0);
  });

  it("marketData.latestQuote(SPY) returns bid/ask", async () => {
    const q = (await marketData.latestQuote("SPY")) as {
      quote?: { ap?: number; bp?: number };
    };
    // After hours one side can be 0 (no live ask, only a resting bid).
    // We just need *some* live price signal.
    expect(q.quote).toBeDefined();
    const best = Math.max(Number(q.quote?.ap ?? 0), Number(q.quote?.bp ?? 0));
    expect(best).toBeGreaterThan(0);
  });

  it("marketData.bars(SPY, 1Day, 5) returns recent bars", async () => {
    const b = (await marketData.bars("SPY", { timeframe: "1Day", limit: 5 })) as {
      bars?: Array<{ c?: number }>;
    };
    expect(Array.isArray(b.bars)).toBe(true);
    expect(b.bars!.length).toBeGreaterThan(0);
  });

  it("news.list({ symbols: SPY }) returns recent headlines", async () => {
    const n = (await news.list({ symbols: "SPY", limit: 3 })) as {
      news?: Array<{ headline?: string }>;
    };
    expect(Array.isArray(n.news)).toBe(true);
    // Don't assert >0 — slow news days exist. Just shape.
  });

  it("marketData.movers returns gainers and losers", async () => {
    const m = (await marketData.movers({ top: 3 })) as {
      gainers?: unknown[];
      losers?: unknown[];
    };
    expect(Array.isArray(m.gainers)).toBe(true);
    expect(Array.isArray(m.losers)).toBe(true);
  });
});
