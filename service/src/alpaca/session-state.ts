// Per-session state for the voice agent's tool loop.
// - pendingOrder: the order the user is mid-confirming (see confirmation.ts)
// - recentSymbols: symbols the agent has actually fetched in this session;
//   order tools refuse to act on symbols not in this set (hallucination guard)

export interface PendingOrder {
  kind: "place" | "cancel";
  summary: string; // human-readable, the agent reads this back verbatim
  body?: Record<string, unknown>; // for place: the Alpaca order body
  orderId?: string; // for cancel: the order to cancel
  createdAt: number;
}

export interface SessionState {
  pendingOrder?: PendingOrder;
  recentSymbols: Set<string>;
  // Emits card events through the global SSE channel. Bound per session so we
  // can extend to per-user channels later without rewiring callers.
  emitCard: (payload: unknown) => void;
}

export function createSessionState(
  emitCard: SessionState["emitCard"],
): SessionState {
  return {
    pendingOrder: undefined,
    recentSymbols: new Set<string>(),
    emitCard,
  };
}

const PENDING_TTL_MS = 60_000;

export function isPendingExpired(state: SessionState, now = Date.now()): boolean {
  return !!state.pendingOrder && now - state.pendingOrder.createdAt > PENDING_TTL_MS;
}
