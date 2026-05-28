// Shared helpers for e2e tests. Captures card events emitted during a test
// so we can assert "this tool emitted the right card."

import { subscribe } from "../src/llm/card-events";

// Tests treat cards as opaque records; the kind discriminator is enough to assert.
export type AnyCard = Record<string, unknown>;

const captured: AnyCard[] = [];
let unsubscribe: (() => void) | null = null;

export function startCapturingCards() {
  if (unsubscribe) return;
  unsubscribe = subscribe((sse: string) => {
    // SSE payload format: "data: {...}\n\n" (possibly with comments)
    for (const line of sse.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice("data: ".length);
      try {
        captured.push(JSON.parse(json));
      } catch {
        /* not a card */
      }
    }
  });
}

export function stopCapturingCards() {
  unsubscribe?.();
  unsubscribe = null;
}

export function resetCapturedCards() {
  captured.length = 0;
}

export function getCapturedCards(): AnyCard[] {
  return [...captured];
}

// Convenience: wait for the next tick so async card emits (we use `void` /
// fire-and-forget in tools.ts) have a chance to land before we assert.
export const tick = (ms = 250) =>
  new Promise<void>((r) => setTimeout(r, ms));
