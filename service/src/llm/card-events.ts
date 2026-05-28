// Global single-session card-event bus. The browser subscribes via SSE at
// /api/events (see index.ts). For the hackathon demo this is one shared
// channel — multi-user correlation is future work.

type Subscriber = (data: string) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(send: Subscriber): () => void {
  subscribers.add(send);
  return () => subscribers.delete(send);
}

export interface OpenOrderCard {
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

export type Card =
  | { kind: "ticker"; symbol: string; company: string; price: number; changePct: number; spark?: number[]; headline?: string }
  | { kind: "portfolio"; dayPL: number; dayPLPct: number; totalValue: number; buyingPower: number; positions: { symbol: string; qty: number; dayPL: number }[]; openOrders: OpenOrderCard[] }
  | { kind: "trade"; side: "buy" | "sell"; symbol: string; qty: number; type: "market" | "limit"; limitPrice?: number; estCost: number }
  | { kind: "fill"; side: "buy" | "sell"; symbol: string; qty: number; avgPrice: number }
  | { kind: "clear" }; // used to dismiss the trade card after fill/cancel

export function emit(card: Card): void {
  const data = `data: ${JSON.stringify(card)}\n\n`;
  for (const sub of subscribers) {
    try {
      sub(data);
    } catch {
      /* drop dead subscribers silently */
    }
  }
}
