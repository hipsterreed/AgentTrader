# AgentTrader

> Talk to your portfolio. Trade by voice.

---

## 🏆 #ElevenHacks 2026

Built for the **ElevenLabs hackathon** ([#ElevenHacks](https://elevenlabs.io/hackathon)). AgentTrader runs on the [ElevenLabs Speech Engine](https://elevenlabs.io) — sub-second voice turns, conversational STT + TTS, and a tool-calling LLM brain underneath that makes it feel like talking to a real analyst on a trading desk.

| | |
|---|---|
| **Hackathon** | ElevenHacks 2026 |
| **Sponsor** | ElevenLabs |
| **Category** | Voice agents · Conversational AI · FinTech |
| **Status** | Working demo against Alpaca paper trading |

📹 **[Demo video →](#)** &nbsp;·&nbsp; 🌐 **[Live demo →](#)** &nbsp;·&nbsp; 📝 **[Submission writeup →](.hackathon/submission.md)**

---

## What it is

AgentTrader is a **voice-first trading agent**. You tap an orb, talk like you would to a senior trader on a desk, and the agent briefs your portfolio, pulls live market data, recommends trades, and places orders against Alpaca paper trading — all by voice. A server-side verbal-confirmation pattern makes it safe enough to demo on stage with real money.

### Features

🎙️ **Voice-first portfolio briefs**
Ask *"how are we looking?"* — get your day P&L, positions, and buying power spoken back in a sentence.

📊 **Live market analysis**
*"What's Nvidia doing?"* returns price, change, sparkline, and how it relates to your existing book — not just the tape.

🧠 **Opinionated AI recommendations**
Real conviction — not *"do your own research"* disclaimers. The agent factors in your portfolio, risk tolerance, and exposure before suggesting trades.

✅ **Verbal trade execution**
*"Buy ten Microsoft."* The agent reads back the order, you confirm, it fills. Sub-second from word to receipt.

📅 **Scheduled & recurring orders**
DCAs, watchlists, price alerts — anything you'd normally do tapping through menus, just by talking.


---

## Stack

| Layer | Tech |
|---|---|
| **Voice** | ElevenLabs Speech Engine (STT + TTS + sub-second turn-taking) |
| **Brain** | OpenAI Responses API (`gpt-4o-mini`) with a ~15-tool whitelist |
| **Broker** | Alpaca Markets — paper trading REST (portfolio · quotes · news · orders) |
| **Backend** | Bun + Elysia + custom WebSocket adapter wrapping `engine.createSession()` |
| **Frontend** | Vite + React 19 + TypeScript + Tailwind v4 |
| **UI** | shadcn/ui primitives · Radix · Lucide · Sonner · Motion |

---

## Architecture

```
┌─────────────┐    WebRTC      ┌──────────────────┐    REST     ┌─────────────┐
│   Browser   │ ◀────────────▶ │  Speech Engine   │             │             │
│  (React)    │                │   (ElevenLabs)   │             │   OpenAI    │
└─────┬───────┘                └─────────┬────────┘             │  Responses  │
      │ SSE                              │ WS                   └──────┬──────┘
      │ cards                            ▼                             │ tools
      ▼                          ┌──────────────────┐                  ▼
┌─────────────┐                  │  Bun + Elysia    │           ┌─────────────┐
│  Card feed  │ ◀──────────────  │   tool loop      │ ◀───────▶ │   Alpaca    │
│  (sidebar + │     broadcast    │  + confirmation  │   REST    │   Markets   │
│   mobile)   │                  │    intercept     │           │   (paper)   │
└─────────────┘                  └──────────────────┘           └─────────────┘
```

The confirmation intercept sits between the LLM tool layer and the Alpaca REST client. When the LLM emits a `place_order` or `cancel_order`, the server **stashes it as pending** instead of forwarding. The agent replies with a verbal readback, and only a subsequent confirm-tool call (which the user must trigger by voice) releases the held order to Alpaca.

---

## Getting started

### Requirements

- [Bun](https://bun.sh) ≥ 1.0
- Accounts: ElevenLabs (Speech Engine), OpenAI, Alpaca (paper trading)
- [ngrok](https://ngrok.com) (dev — exposes the local WS to ElevenLabs)

---

