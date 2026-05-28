// Server-side confirmation intercept. Mutating order tools (place / cancel)
// don't actually hit Alpaca on first call — they stash a pending order keyed
// to the session and return a human-readable summary. The agent reads it back
// to the user, who then says "confirm" (or "cancel"), triggering a separate
// confirm_pending_order / cancel_pending_order tool that actually commits.
//
// Prompt-only safety gets jailbroken on stage. This is enforced in code.

import { trading, marketData } from "./client";
import type { SessionState, PendingOrder } from "./session-state";
import { isPendingExpired } from "./session-state";
import { emit as emitCard } from "../llm/card-events";

export interface InterceptResult {
  status: "awaiting_confirmation";
  summary: string;
  note?: string;
}

export interface CommitResult {
  status: "filled" | "submitted" | "cancelled" | "no_pending" | "expired";
  detail?: unknown;
  message?: string;
}

// Intercept a place_stock_order call.
export async function interceptPlace(
  args: {
    symbol: string;
    qty: number;
    side: "buy" | "sell";
    type?: "market" | "limit";
    limit_price?: number;
    time_in_force?: string;
  },
  state: SessionState,
): Promise<InterceptResult> {
  const symbol = String(args.symbol || "").toUpperCase();
  const qty = Number(args.qty);
  const side = args.side;
  const type = args.type ?? "market";
  const tif = args.time_in_force ?? "day";

  // Hallucination guard: symbol must have been validated in this session.
  if (!state.recentSymbols.has(symbol)) {
    return {
      status: "awaiting_confirmation",
      summary: "",
      note: `I need to look up ${symbol} first before I can place that order. Let me do that.`,
    };
  }

  // Estimate cost using the latest trade we can pull. Best-effort.
  let estCost = 0;
  let estPrice = 0;
  try {
    const snap = (await marketData.latestTrade(symbol)) as { trade?: { p?: number } };
    estPrice = Number(snap.trade?.p ?? 0);
    estCost = Math.round(estPrice * qty * 100) / 100;
  } catch {
    /* ignore — we'll proceed without an estimate */
  }

  const sideWord = side === "buy" ? "Buy" : "Sell";
  const limitPart =
    type === "limit" && args.limit_price
      ? ` at ${args.limit_price.toFixed(2)} limit`
      : " at market";
  const costPart = estCost
    ? `, about ${formatMoney(estCost)} at the current price`
    : "";
  const summary = `${sideWord} ${qty} ${symbol}${limitPart}${costPart}. Confirm?`;

  const pending: PendingOrder = {
    kind: "place",
    summary,
    body: {
      symbol,
      qty: String(qty),
      side,
      type,
      time_in_force: tif,
      ...(type === "limit" && args.limit_price
        ? { limit_price: String(args.limit_price) }
        : {}),
    },
    createdAt: Date.now(),
  };
  state.pendingOrder = pending;

  // Surface the trade card to the UI.
  emitCard({
    kind: "trade",
    side,
    symbol,
    qty,
    type,
    limitPrice: args.limit_price,
    estCost,
  });

  return { status: "awaiting_confirmation", summary };
}

// Intercept a cancel_order_by_id call.
export async function interceptCancel(
  args: { order_id: string },
  state: SessionState,
): Promise<InterceptResult> {
  const orderId = String(args.order_id);
  // Look up the order so we can read it back.
  let summary = `Cancel order ${shortId(orderId)}. Confirm?`;
  try {
    const o = (await trading.orderById(orderId)) as {
      symbol?: string;
      qty?: string;
      side?: string;
      type?: string;
    };
    if (o.symbol) {
      summary = `Cancel the ${o.side ?? ""} order for ${o.qty ?? ""} ${o.symbol}. Confirm?`.trim();
    }
  } catch {
    /* fall through with id-only summary */
  }

  state.pendingOrder = {
    kind: "cancel",
    summary,
    orderId,
    createdAt: Date.now(),
  };

  return { status: "awaiting_confirmation", summary };
}

// Actually commit the pending order against Alpaca.
export async function commit(state: SessionState): Promise<CommitResult> {
  const p = state.pendingOrder;
  if (!p) return { status: "no_pending", message: "Nothing to confirm." };
  if (isPendingExpired(state)) {
    state.pendingOrder = undefined;
    return { status: "expired", message: "That order timed out — say it again if you still want it." };
  }

  if (p.kind === "place" && p.body) {
    const result = (await trading.placeOrder(p.body)) as {
      id: string;
      status: string;
      symbol: string;
      qty: string;
      side: "buy" | "sell";
      filled_qty?: string;
      filled_avg_price?: string;
    };
    state.pendingOrder = undefined;

    // Emit fill card. Market orders usually fill instantly in paper; if not,
    // we still show what we know.
    emitCard({
      kind: "fill",
      side: result.side,
      symbol: result.symbol,
      qty: Number(result.filled_qty ?? result.qty),
      avgPrice: Number(result.filled_avg_price ?? 0),
    });
    // Clear the trade card after a beat.
    setTimeout(() => emitCard({ kind: "clear" }), 100);

    return { status: result.status === "filled" ? "filled" : "submitted", detail: result };
  }

  if (p.kind === "cancel" && p.orderId) {
    await trading.cancelOrder(p.orderId);
    state.pendingOrder = undefined;
    emitCard({ kind: "clear" });
    return { status: "cancelled" };
  }

  return { status: "no_pending" };
}

export function abandon(state: SessionState): { status: "abandoned" | "no_pending" } {
  if (!state.pendingOrder) return { status: "no_pending" };
  state.pendingOrder = undefined;
  emitCard({ kind: "clear" });
  return { status: "abandoned" };
}

function formatMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}
