// Voice-friendly subset of Alpaca's MCP surface (~10 tools out of 61).
// Tool *names* match Alpaca's official MCP server exactly so the LLM-visible
// interface is MCP-compatible. Implementation calls REST directly.
//
// Mutating order tools go through confirmation.ts — they don't hit Alpaca on
// first call.

import { trading, marketData, news } from "./client";
import * as confirmation from "./confirmation";
import type { SessionState } from "./session-state";
import { emit as emitCard } from "../llm/card-events";
import { fetchPortfolioSnapshot } from "./portfolio";

// OpenAI Responses-API function-tool shape.
export interface ToolDef {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
  // ---------- account / positions ----------
  {
    type: "function",
    name: "get_account_info",
    description:
      "Get the user's account: equity, cash, buying power, day P&L. Use when the user asks 'how am I doing', 'what's my buying power', or in a morning brief.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_all_positions",
    description:
      "Get every open position the user holds (symbol, qty, market value, unrealized P&L, % change). Use when the user asks for a portfolio brief or wants to know what they own.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "get_open_position",
    description:
      "Get details for a single position by symbol (qty, avg entry, P&L). Use when the user asks about one specific holding.",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
      additionalProperties: false,
    },
  },

  // ---------- quotes / data ----------
  {
    type: "function",
    name: "get_stock_snapshot",
    description:
      "Get a comprehensive snapshot for one stock (latest trade, latest quote, today's bar, previous day). Use this when the user asks 'what's NVDA doing' or wants today's move. ALSO validates the symbol — call this before placing an order to verify ticker.",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_stock_latest_quote",
    description:
      "Get just the latest bid/ask for one stock. Prefer get_stock_snapshot unless you only need the current price.",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_stock_bars",
    description:
      "Get historical OHLC bars for one stock (for trend, recent action). timeframe like '1Day' or '5Min'. limit is number of bars.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        timeframe: { type: "string", description: "e.g. '1Day', '1Hour', '5Min'" },
        limit: { type: "number", description: "1-100" },
      },
      required: ["symbol", "timeframe"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_news",
    description:
      "Get recent news headlines for one or more symbols. Use when the user asks 'anything moving', 'what's happening with X', or before recommending a trade.",
    parameters: {
      type: "object",
      properties: {
        symbols: {
          type: "string",
          description: "Comma-separated tickers, e.g. 'NVDA,AAPL'",
        },
        limit: { type: "number", description: "1-20" },
      },
      required: ["symbols"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_market_movers",
    description:
      "Get the top gaining and losing stocks today. Use when the user asks 'what's moving' or wants idea generation.",
    parameters: {
      type: "object",
      properties: { top: { type: "number", description: "1-25, default 5" } },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_asset",
    description:
      "Look up an asset by symbol to validate it exists and is tradable. ALWAYS call this before placing an order if you haven't already fetched a snapshot for the symbol.",
    parameters: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
      additionalProperties: false,
    },
  },

  // ---------- orders ----------
  {
    type: "function",
    name: "get_orders",
    description:
      "List recent orders. status='open' for working orders, 'closed' for filled/cancelled history, 'all' for both.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "closed", "all"] },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_account_activities",
    description:
      "Get recent account activities (fills, dividends, transfers). Use when the user asks about trade history or 'how did X trade work out'. activity_types='FILL' for trades.",
    parameters: {
      type: "object",
      properties: {
        activity_types: { type: "string", description: "e.g. 'FILL'" },
        page_size: { type: "number" },
      },
      additionalProperties: false,
    },
  },

  // ---------- order mutations (INTERCEPTED — see confirmation.ts) ----------
  {
    type: "function",
    name: "place_stock_order",
    description:
      "Place a stock order. This DOES NOT immediately execute — it stages the order and returns awaiting_confirmation. Read the returned summary back to the user verbatim and ask them to confirm. Only then call confirm_pending_order. Always validate the symbol with get_stock_snapshot or get_asset FIRST.",
    parameters: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        qty: { type: "number" },
        side: { type: "string", enum: ["buy", "sell"] },
        type: { type: "string", enum: ["market", "limit"] },
        limit_price: { type: "number" },
        time_in_force: { type: "string", enum: ["day", "gtc"] },
      },
      required: ["symbol", "qty", "side"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "cancel_order_by_id",
    description:
      "Stage a cancellation for an open order by its id. Like place_stock_order, this returns awaiting_confirmation — the user must verbally confirm before it commits.",
    parameters: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "confirm_pending_order",
    description:
      "Commit the pending order (place or cancel) after the user has verbally confirmed. Only call this AFTER the user said yes / confirm / go / do it.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    type: "function",
    name: "cancel_pending_order",
    description:
      "Discard a pending order (place or cancel) without committing it. Call when the user says no / nevermind / cancel that.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
];

// Build + emit a portfolio card from the shared snapshot helper. Also marks
// the positions' symbols as "seen" so the hallucination guard passes when the
// agent next places an order on something it just looked at.
async function emitPortfolioCardIfReady(state: SessionState) {
  try {
    const snap = await fetchPortfolioSnapshot();
    for (const p of snap.positions) state.recentSymbols.add(p.symbol);
    emitCard({
      kind: "portfolio",
      dayPL: snap.dayPL,
      dayPLPct: snap.dayPLPct,
      totalValue: snap.totalValue,
      buyingPower: snap.buyingPower,
      positions: snap.positions,
      openOrders: snap.openOrders,
    });
  } catch {
    /* card is best-effort */
  }
}

async function emitRichTickerCard(symbol: string, snap: unknown): Promise<void> {
  const s = snap as {
    latestTrade?: { p?: number };
    latestQuote?: { ap?: number; bp?: number };
    minuteBar?: { c?: number };
    dailyBar?: { c?: number };
    prevDailyBar?: { c?: number };
  };
  const price = s.latestTrade?.p ?? s.latestQuote?.ap ?? s.dailyBar?.c ?? 0;
  const prev = s.prevDailyBar?.c ?? price;
  const changePct = prev ? ((price - prev) / prev) * 100 : 0;

  // Fetch sparkline bars + asset (for company name) in parallel — best-effort,
  // card is emitted even if either fails.
  const [bars, asset] = await Promise.allSettled([
    marketData.bars(symbol, { timeframe: "1Day", limit: 30 }),
    trading.asset(symbol),
  ]);

  const spark =
    bars.status === "fulfilled"
      ? ((bars.value as { bars?: Array<{ c?: number }> }).bars ?? [])
          .map((b) => Number(b.c ?? 0))
          .filter((n) => n > 0)
      : [];

  const company =
    asset.status === "fulfilled"
      ? String((asset.value as { name?: string }).name ?? symbol)
      : symbol;

  emitCard({
    kind: "ticker",
    symbol,
    company,
    price: round2(price),
    changePct: round2(changePct),
    spark,
  });
}

// ---------- dispatcher ----------
export async function dispatch(
  name: string,
  rawArgs: string,
  state: SessionState,
): Promise<unknown> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  } catch {
    return { error: "invalid_arguments" };
  }

  switch (name) {
    case "get_account_info":
      return await trading.account();

    case "get_all_positions": {
      const positions = (await trading.positions()) as Array<{ symbol?: string }>;
      for (const p of positions) {
        if (p.symbol) state.recentSymbols.add(String(p.symbol).toUpperCase());
      }
      void emitPortfolioCardIfReady(state);
      return positions;
    }

    case "get_open_position": {
      const sym = String(args.symbol).toUpperCase();
      const r = await trading.position(sym);
      state.recentSymbols.add(sym);
      return r;
    }

    case "get_stock_snapshot": {
      const sym = String(args.symbol).toUpperCase();
      const snap = await marketData.snapshot(sym);
      state.recentSymbols.add(sym);
      // Fire-and-forget: card emit runs in background with bars + asset so the
      // agent can start speaking immediately while the card hydrates.
      void emitRichTickerCard(sym, snap);
      return snap;
    }

    case "get_stock_latest_quote": {
      const sym = String(args.symbol).toUpperCase();
      const q = await marketData.latestQuote(sym);
      state.recentSymbols.add(sym);
      return q;
    }

    case "get_stock_bars": {
      const sym = String(args.symbol).toUpperCase();
      state.recentSymbols.add(sym);
      return await marketData.bars(sym, {
        timeframe: String(args.timeframe ?? "1Day"),
        limit: Number(args.limit ?? 30),
      });
    }

    case "get_news":
      return await news.list({
        symbols: String(args.symbols ?? ""),
        limit: Number(args.limit ?? 5),
      });

    case "get_market_movers":
      return await marketData.movers({ top: Number(args.top ?? 5) });

    case "get_asset": {
      const sym = String(args.symbol).toUpperCase();
      const a = await trading.asset(sym);
      state.recentSymbols.add(sym);
      return a;
    }

    case "get_orders":
      return await trading.orders({
        status: String(args.status ?? "open"),
        limit: Number(args.limit ?? 20),
      });

    case "get_account_activities":
      return await trading.activities({
        activity_types: String(args.activity_types ?? "FILL"),
        page_size: Number(args.page_size ?? 20),
      });

    case "place_stock_order":
      return await confirmation.interceptPlace(args as never, state);

    case "cancel_order_by_id":
      return await confirmation.interceptCancel(args as never, state);

    case "confirm_pending_order":
      return await confirmation.commit(state);

    case "cancel_pending_order":
      return confirmation.abandon(state);

    default:
      return { error: `unknown_tool: ${name}` };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
