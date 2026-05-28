import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import type { ServerWebSocket } from "bun";
import { runTurn } from "./llm/tool-loop";
import { createSessionState } from "./alpaca/session-state";
import { subscribe, emit as emitCard } from "./llm/card-events";
import { trading, verifyCredentials } from "./alpaca/client";
import { fetchPortfolioSnapshot } from "./alpaca/portfolio";
import { fetchSpotlight } from "./alpaca/spotlight";

const PORT = Number(process.env.PORT ?? 3001);
const { ELEVENLABS_API_KEY, OPENAI_API_KEY, SPEECH_ENGINE_ID } = process.env;

if (!ELEVENLABS_API_KEY || !OPENAI_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY or OPENAI_API_KEY");
}
if (!SPEECH_ENGINE_ID) {
  throw new Error("Missing SPEECH_ENGINE_ID");
}

const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Smoke-test Alpaca creds — fail loud at boot if .env.local is misconfigured.
try {
  const acc = await verifyCredentials();
  console.log(`[alpaca] connected to paper account ${acc.account_number}`);
} catch (err) {
  console.error("[alpaca] cred verification failed:", (err as Error).message);
  throw err;
}

// Engine handle — exposes verifyRequest() (checks the ElevenLabs JWT header) and
// createSession() (wraps a socket in a typed SpeechEngineSession).
const engine = await elevenlabs.speechEngine.get(SPEECH_ENGINE_ID);

// --- HTTP via Elysia: WebRTC tokens + SSE card events for the browser ---
const app = new Elysia()
  .use(cors())
  .get("/api/token", async () => {
    const { token } =
      await elevenlabs.conversationalAi.conversations.getWebrtcToken({
        agentId: SPEECH_ENGINE_ID,
      });
    return { token };
  })
  // Single-session card event stream. The browser opens this once; the server
  // broadcasts every tool-call card payload here. Multi-user correlation is
  // future work — for the hackathon demo there's only one user.
  .get("/api/events", () => {
    const stream = new ReadableStream({
      start(controller) {
        const send = (data: string) => {
          try {
            controller.enqueue(new TextEncoder().encode(data));
          } catch {
            /* connection went away */
          }
        };
        send(`: connected\n\n`);
        const unsubscribe = subscribe(send);
        // Heartbeat to keep proxies from idling the connection out.
        const heartbeat = setInterval(() => {
          try {
            send(`: heartbeat\n\n`);
          } catch {
            /* ignore */
          }
        }, 15000);
        // When the controller closes, clean up.
        (controller as { _cleanup?: () => void })._cleanup = () => {
          clearInterval(heartbeat);
          unsubscribe();
        };
      },
      cancel(reason) {
        const c = this as unknown as { _cleanup?: () => void };
        c._cleanup?.();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  })
  // Sidebar fetches this on app load — gives the desktop layout something to
  // show before the agent has been asked for a brief.
  .get("/api/portfolio", async () => {
    try {
      return await fetchPortfolioSnapshot();
    } catch (err) {
      return new Response((err as Error).message, { status: 502 });
    }
  })
  // UI shortcut for cancelling a pending order via the sidebar × button.
  // Voice path still goes through the LLM's cancel_order tool (with the
  // confirmation intercept) — this is the tap-on-the-row affordance.
  .delete("/api/orders/:id", async ({ params }) => {
    try {
      await trading.cancelOrder(params.id);
      return { ok: true };
    } catch (err) {
      return new Response((err as Error).message, { status: 502 });
    }
  })
  // Curated "what's moving" feed shown on the empty state so the app feels
  // alive before the user has talked to the agent.
  .get("/api/spotlight", async () => {
    try {
      return await fetchSpotlight();
    } catch (err) {
      return new Response((err as Error).message, { status: 502 });
    }
  })
  .get("/health", () => ({ ok: true }));

// --- WS adapter: bridge Bun's native socket to the SDK's `ws`-style interface
// (on/send/close/readyState). The SDK only uses this subset. ---
type Listener = (...args: unknown[]) => void;
class WsAdapter {
  readyState = 1; // OPEN
  private listeners = new Map<string, Listener[]>();
  constructor(
    private _send: (data: string) => void,
    private _close: () => void,
  ) {}
  on(event: string, cb: Listener) {
    const arr = this.listeners.get(event) ?? [];
    arr.push(cb);
    this.listeners.set(event, arr);
    return this;
  }
  emit(event: string, ...args: unknown[]) {
    for (const cb of this.listeners.get(event) ?? []) cb(...args);
  }
  send(data: string) {
    this._send(data);
  }
  close() {
    this._close();
  }
}

type WsData = { adapter?: WsAdapter };

Bun.serve<WsData>({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      // Verify the request is a genuine ElevenLabs Speech Engine connection.
      const headers = Object.fromEntries(req.headers);
      if (!(await engine.verifyRequest({ headers }))) {
        return new Response("unauthorized", { status: 401 });
      }
      if (server.upgrade(req, { data: {} as WsData })) return;
      return new Response("upgrade failed", { status: 400 });
    }
    return app.handle(req);
  },
  websocket: {
    open(ws: ServerWebSocket<WsData>) {
      const adapter = new WsAdapter(
        (data) => ws.send(data),
        () => ws.close(),
      );
      const session = engine.createSession(
        adapter as unknown as Parameters<typeof engine.createSession>[0],
        { debug: true },
      );

      // Per-session state — pending order, recent symbols, card emitter.
      const state = createSessionState((payload) =>
        emitCard(payload as never),
      );

      session.on("init", (id) => console.log("[speech] session init:", id));
      session.on("user_transcript", async (transcript, signal) => {
        try {
          await runTurn({
            openai,
            transcript: transcript as never,
            signal,
            state,
            sendResponse: (stream) => session.sendResponse(stream as never),
          });
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            console.error("[turn] error:", err);
          }
        }
      });
      session.on("close", () => console.log("[speech] session closed"));
      session.on("error", (err) => console.error("[speech] session error:", err));

      ws.data.adapter = adapter;
    },
    message(ws: ServerWebSocket<WsData>, message) {
      ws.data.adapter?.emit(
        "message",
        typeof message === "string" ? message : message.toString(),
      );
    },
    close(ws: ServerWebSocket<WsData>) {
      ws.data.adapter?.emit("close");
    },
  },
});

console.log(
  `service listening on :${PORT}  (HTTP /api/token, SSE /api/events, WS /ws)`,
);
