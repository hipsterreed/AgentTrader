// e2e: full order lifecycle through the confirmation intercept.
//
// SAFETY NOTES
// - All orders are LIMIT BUY at a price ridiculously far below market so they
//   sit accepted/working and never fill — true "won't-touch-your-balance" mode.
// - Every test cancels the order it placed; an afterAll sweep cancels any
//   stragglers in case a test threw mid-flight.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { dispatch } from "../src/alpaca/tools";
import { createSessionState } from "../src/alpaca/session-state";
import * as confirmation from "../src/alpaca/confirmation";
import { trading, marketData } from "../src/alpaca/client";
import { emit as serverEmit } from "../src/llm/card-events";
import {
  startCapturingCards,
  stopCapturingCards,
  resetCapturedCards,
  getCapturedCards,
  tick,
} from "./helpers";

const sessionEmit = (card: unknown) => serverEmit(card as never);

// SPY at $1 limit — won't fill, cheap to test against. We use limit_price as
// a string because Alpaca's API expects that.
const FAR_BELOW_MARKET = 1;
const placedOrderIds: string[] = [];

beforeAll(() => startCapturingCards());
afterAll(async () => {
  stopCapturingCards();
  // Safety net: cancel any orders we placed across the suite.
  for (const id of placedOrderIds) {
    try {
      await trading.cancelOrder(id);
    } catch {
      /* already cancelled or filled — fine */
    }
  }
});
beforeEach(() => resetCapturedCards());

describe("confirmation intercept — hallucination guard", () => {
  it("rejects place_stock_order when symbol hasn't been validated this session", async () => {
    const state = createSessionState(sessionEmit);
    // recentSymbols is empty — agent skipped the get_asset/snapshot step.
    const r = (await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 1, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    )) as { status: string; summary: string; note?: string };

    expect(r.status).toBe("awaiting_confirmation");
    expect(r.summary).toBe(""); // empty — agent must look up first
    expect(r.note).toContain("look up");
    expect(state.pendingOrder).toBeUndefined(); // nothing staged
  });

  it("accepts place_stock_order after the symbol has been validated", async () => {
    const state = createSessionState(sessionEmit);
    // Simulate the LLM calling get_asset first.
    await dispatch("get_asset", JSON.stringify({ symbol: "SPY" }), state);

    const r = (await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 1, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    )) as { status: string; summary: string };

    expect(r.status).toBe("awaiting_confirmation");
    expect(r.summary).toContain("SPY");
    expect(r.summary).toContain("Confirm?");
    expect(state.pendingOrder).toBeDefined();
    expect(state.pendingOrder?.kind).toBe("place");
  });
});

describe("confirmation intercept — trade card", () => {
  it("emits a trade card with the right side/symbol/qty", async () => {
    const state = createSessionState(sessionEmit);
    await dispatch("get_asset", JSON.stringify({ symbol: "SPY" }), state);
    await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 2, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    );
    await tick(100);
    const trade = getCapturedCards().find((c) => c.kind === "trade");
    expect(trade).toBeDefined();
    expect(trade).toMatchObject({ side: "buy", symbol: "SPY", qty: 2, type: "limit" });
  });
});

describe("confirmation intercept — abandon", () => {
  it("cancel_pending_order clears state without hitting Alpaca", async () => {
    const state = createSessionState(sessionEmit);
    await dispatch("get_asset", JSON.stringify({ symbol: "SPY" }), state);
    await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 1, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    );
    expect(state.pendingOrder).toBeDefined();

    const r = (await dispatch("cancel_pending_order", "{}", state)) as { status: string };
    expect(r.status).toBe("abandoned");
    expect(state.pendingOrder).toBeUndefined();

    await tick(50);
    const clear = getCapturedCards().find((c) => c.kind === "clear");
    expect(clear).toBeDefined();
  });

  it("commit without a pending order returns no_pending", async () => {
    const state = createSessionState(sessionEmit);
    const r = (await dispatch("confirm_pending_order", "{}", state)) as { status: string };
    expect(r.status).toBe("no_pending");
  });
});

describe("confirmation intercept — expiry", () => {
  it("commit on a 61s-old pending order returns expired", async () => {
    const state = createSessionState(sessionEmit);
    await dispatch("get_asset", JSON.stringify({ symbol: "SPY" }), state);
    await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 1, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    );
    // Time-warp the createdAt.
    state.pendingOrder!.createdAt = Date.now() - 61_000;

    const r = (await dispatch("confirm_pending_order", "{}", state)) as { status: string };
    expect(r.status).toBe("expired");
    expect(state.pendingOrder).toBeUndefined();
  });
});

describe("full lifecycle — real order placed + cancelled", () => {
  it("intercept → commit places a real order, then cancel cleans up", async () => {
    const state = createSessionState(sessionEmit);
    await dispatch("get_asset", JSON.stringify({ symbol: "SPY" }), state);

    // Stage.
    const staged = (await dispatch(
      "place_stock_order",
      JSON.stringify({ symbol: "SPY", qty: 1, side: "buy", type: "limit", limit_price: FAR_BELOW_MARKET }),
      state,
    )) as { status: string };
    expect(staged.status).toBe("awaiting_confirmation");

    // Commit — this hits Alpaca for real.
    const committed = (await dispatch("confirm_pending_order", "{}", state)) as {
      status: string;
      detail?: { id?: string; status?: string };
    };
    expect(["submitted", "filled"]).toContain(committed.status);
    expect(committed.detail?.id).toBeString();

    const orderId = committed.detail!.id!;
    placedOrderIds.push(orderId);

    // The order should appear in our open orders (assuming it didn't fill,
    // which it won't at $1 for SPY).
    const orders = (await trading.orders({ status: "open", limit: 50 })) as Array<{
      id: string;
    }>;
    expect(orders.some((o) => o.id === orderId)).toBe(true);

    // Cancel via the public dispatch path too.
    await dispatch(
      "cancel_order_by_id",
      JSON.stringify({ order_id: orderId }),
      state,
    );
    expect(state.pendingOrder?.kind).toBe("cancel");
    const cancelled = (await dispatch("confirm_pending_order", "{}", state)) as {
      status: string;
    };
    expect(cancelled.status).toBe("cancelled");

    // Verify it's gone from the open book (give Alpaca a moment to process).
    await tick(500);
    const openAfter = (await trading.orders({ status: "open", limit: 50 })) as Array<{
      id: string;
    }>;
    expect(openAfter.some((o) => o.id === orderId)).toBe(false);
  }, 30_000); // longer timeout — round-trip to Alpaca twice
});
