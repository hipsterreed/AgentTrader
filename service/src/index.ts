import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import OpenAI from "openai";
import type { ServerWebSocket } from "bun";

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

// Engine handle — exposes verifyRequest() (checks the ElevenLabs JWT header) and
// createSession() (wraps a socket in a typed SpeechEngineSession).
const engine = await elevenlabs.speechEngine.get(SPEECH_ENGINE_ID);

// --- HTTP via Elysia: mint short-lived WebRTC tokens for the browser ---
const app = new Elysia()
  .use(cors())
  .get("/api/token", async () => {
    const { token } =
      await elevenlabs.conversationalAi.conversations.getWebrtcToken({
        agentId: SPEECH_ENGINE_ID,
      });
    return { token };
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

      session.on("init", (id) => console.log("session init:", id));
      session.on("user_transcript", async (transcript, signal) => {
        try {
          const stream = await openai.responses.create(
            {
              model: "gpt-4o-mini", // fast for low-latency voice; swap to gpt-4o for quality
              instructions: "You are a helpful, concise voice assistant.",
              input: transcript.map((m) => ({
                role: m.role === "agent" ? ("assistant" as const) : m.role,
                content: m.content,
              })),
              stream: true,
            },
            { signal },
          );
          session.sendResponse(stream);
        } catch (err) {
          if ((err as Error)?.name !== "AbortError") {
            console.error("transcript error:", err);
          }
        }
      });
      session.on("close", () => console.log("session closed"));
      session.on("error", (err) => console.error("session error:", err));

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

console.log(`service listening on :${PORT}  (HTTP /api/token, WS /ws)`);
