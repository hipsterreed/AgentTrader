// Thin REST client for Alpaca (paper). Keeps us off the Python uvx subprocess
// dependency that the official MCP server requires. Tool *names* in tools.ts
// match Alpaca MCP 1:1 on the subset we expose — the LLM sees an MCP-compatible
// interface, the implementation just talks REST.

const TRADING_BASE = process.env.ALPACA_ENDPOINT ?? "https://paper-api.alpaca.markets/v2";
const DATA_BASE = "https://data.alpaca.markets/v2";
const DATA_BETA_BASE = "https://data.alpaca.markets/v1beta1";

const KEY = process.env.ALPACA_KEY;
const SECRET = process.env.ALPACA_SECRET;

if (!KEY || !SECRET) {
  throw new Error("Missing ALPACA_KEY or ALPACA_SECRET in service/.env.local");
}

const headers = {
  "APCA-API-KEY-ID": KEY,
  "APCA-API-SECRET-KEY": SECRET,
  "Content-Type": "application/json",
};

type Query = Record<string, string | number | boolean | undefined>;

function qs(q?: Query): string {
  if (!q) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca ${method} ${url} → ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// ---------- trading API (account + orders + positions) ----------
export const trading = {
  account: () => req<unknown>("GET", `${TRADING_BASE}/account`),
  positions: () => req<unknown>("GET", `${TRADING_BASE}/positions`),
  position: (symbol: string) =>
    req<unknown>("GET", `${TRADING_BASE}/positions/${encodeURIComponent(symbol)}`),
  orders: (q?: Query) => req<unknown>("GET", `${TRADING_BASE}/orders${qs(q)}`),
  orderById: (id: string) =>
    req<unknown>("GET", `${TRADING_BASE}/orders/${encodeURIComponent(id)}`),
  placeOrder: (body: Record<string, unknown>) =>
    req<unknown>("POST", `${TRADING_BASE}/orders`, body),
  cancelOrder: (id: string) =>
    req<unknown>("DELETE", `${TRADING_BASE}/orders/${encodeURIComponent(id)}`),
  asset: (symbol: string) =>
    req<unknown>("GET", `${TRADING_BASE}/assets/${encodeURIComponent(symbol)}`),
  clock: () => req<unknown>("GET", `${TRADING_BASE}/clock`),
  activities: (q?: Query) =>
    req<unknown>("GET", `${TRADING_BASE}/account/activities${qs(q)}`),
  portfolioHistory: (q?: Query) =>
    req<unknown>("GET", `${TRADING_BASE}/account/portfolio/history${qs(q)}`),
};

// ---------- market data API (quotes + bars + snapshot + movers) ----------
// Free-tier Alpaca defaults to IEX feed; we make that explicit on data endpoints
// so behavior is predictable. Bars without a `start` returns null on free tier —
// we default to a 30-day lookback if the caller doesn't supply one.

function withIex(q?: Query): Query {
  return { feed: "iex", ...(q ?? {}) };
}

function thirtyDaysAgoIso(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const marketData = {
  latestQuote: (symbol: string) =>
    req<unknown>(
      "GET",
      `${DATA_BASE}/stocks/${encodeURIComponent(symbol)}/quotes/latest${qs(withIex())}`,
    ),
  latestTrade: (symbol: string) =>
    req<unknown>(
      "GET",
      `${DATA_BASE}/stocks/${encodeURIComponent(symbol)}/trades/latest${qs(withIex())}`,
    ),
  snapshot: (symbol: string) =>
    req<unknown>(
      "GET",
      `${DATA_BASE}/stocks/${encodeURIComponent(symbol)}/snapshot${qs(withIex())}`,
    ),
  bars: (symbol: string, q: Query) => {
    const merged: Query = { start: thirtyDaysAgoIso(), ...withIex(q) };
    return req<unknown>(
      "GET",
      `${DATA_BASE}/stocks/${encodeURIComponent(symbol)}/bars${qs(merged)}`,
    );
  },
  movers: (q?: Query) =>
    req<unknown>("GET", `${DATA_BETA_BASE}/screener/stocks/movers${qs(q)}`),
};

// ---------- news ----------
export const news = {
  list: (q?: Query) => req<unknown>("GET", `${DATA_BETA_BASE}/news${qs(q)}`),
};

// Smoke check, called on boot to fail loud if creds are bad.
export async function verifyCredentials(): Promise<{ account_number: string }> {
  return req<{ account_number: string }>("GET", `${TRADING_BASE}/account`);
}
