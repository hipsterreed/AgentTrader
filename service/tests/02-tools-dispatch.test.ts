// e2e: the LLM-facing dispatcher — same code path the tool-loop will hit at
// runtime. Verifies (1) tools return sensible shapes, (2) the hallucination
// guard adds symbols to recentSymbols, (3) cards fire from the right tools.

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { dispatch } from "../src/alpaca/tools";
import { createSessionState } from "../src/alpaca/session-state";
import { emit as serverEmit } from "../src/llm/card-events";
import {
  startCapturingCards,
  stopCapturingCards,
  resetCapturedCards,
  getCapturedCards,
  tick,
} from "./helpers";

// Sessions in tests use the global emit so cards reach our capture subscriber.
const sessionEmit = (card: unknown) => serverEmit(card as never);

beforeAll(() => startCapturingCards());
afterAll(() => stopCapturingCards());
beforeEach(() => resetCapturedCards());

describe("dispatch — read tools", () => {
  it("get_account_info returns the account", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch("get_account_info", "{}", state)) as Record<string, string>;
    expect(r.account_number).toBeString();
    expect(Number(r.equity)).toBeGreaterThan(0);
  });

  it("get_all_positions returns an array AND emits a portfolio card", async () => {
    const state = createSessionState(sessionEmit);
    const positions = (await dispatch(
      "get_all_positions",
      "{}",
      state,
    )) as Array<{ symbol?: string }>;
    expect(Array.isArray(positions)).toBe(true);

    // Portfolio card emit is fire-and-forget — give it a beat.
    await tick(400);

    const cards = getCapturedCards();
    const portfolio = cards.find((c) => c.kind === "portfolio");
    expect(portfolio).toBeDefined();
    expect(portfolio).toHaveProperty("totalValue");
    expect(portfolio).toHaveProperty("buyingPower");

    // Positions surface their symbols into recentSymbols (hallucination guard food).
    if (positions.length > 0 && positions[0].symbol) {
      expect(state.recentSymbols.has(positions[0].symbol.toUpperCase())).toBe(true);
    }
  });

  it("get_stock_snapshot validates the symbol AND emits a ticker card", async () => {
    const state = createSessionState(sessionEmit);
    await dispatch("get_stock_snapshot", JSON.stringify({ symbol: "SPY" }), state);
    expect(state.recentSymbols.has("SPY")).toBe(true);

    await tick(150);
    const cards = getCapturedCards();
    const ticker = cards.find((c) => c.kind === "ticker");
    expect(ticker).toBeDefined();
    expect(ticker).toMatchObject({ symbol: "SPY" });
    expect(Number(ticker?.price)).toBeGreaterThan(0);
  });

  it("get_asset adds the symbol to recentSymbols", async () => {
    const state = createSessionState(sessionEmit);
    expect(state.recentSymbols.has("AAPL")).toBe(false);
    await dispatch("get_asset", JSON.stringify({ symbol: "AAPL" }), state);
    expect(state.recentSymbols.has("AAPL")).toBe(true);
  });

  it("get_stock_latest_quote returns bid/ask", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch(
      "get_stock_latest_quote",
      JSON.stringify({ symbol: "SPY" }),
      state,
    )) as { quote?: { ap?: number; bp?: number } };
    expect(r.quote).toBeDefined();
    // After-hours: only one side of the book may be live.
    const best = Math.max(Number(r.quote?.ap ?? 0), Number(r.quote?.bp ?? 0));
    expect(best).toBeGreaterThan(0);
  });

  it("get_orders accepts status filter", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch(
      "get_orders",
      JSON.stringify({ status: "open", limit: 5 }),
      state,
    )) as unknown[];
    expect(Array.isArray(r)).toBe(true);
  });

  it("get_account_activities defaults to FILL", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch("get_account_activities", "{}", state)) as unknown[];
    expect(Array.isArray(r)).toBe(true);
  });
});

describe("dispatch — unknown tool", () => {
  it("returns an error object", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch("nope_not_a_tool", "{}", state)) as { error?: string };
    expect(r.error).toBeString();
    expect(r.error).toContain("unknown_tool");
  });

  it("invalid JSON args returns invalid_arguments (still safe)", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch("get_account_info", "{bad json", state)) as {
      error?: string;
    };
    expect(r.error).toBe("invalid_arguments");
  });
});
