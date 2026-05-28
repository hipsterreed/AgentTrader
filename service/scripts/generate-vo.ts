// Generate the presentation voiceover clips via the ElevenLabs TTS REST API.
// Reads ELEVENLABS_API_KEY from service/.env.local (auto-loaded by Bun) and
// writes mp3s into app/public/vo/ so the running app can serve them directly.
//
// Pure-dialog version: agent ("Michael" / Snap voice) and user (Alexandra)
// trade lines back and forth across Brief / Ticker / Trade scenes. Hero,
// ElevenLabs, and Outro are visual-only (no VO).
//
// Run from service/:  bun run scripts/generate-vo.ts

import { mkdir, readdir, unlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const API_KEY = process.env.ELEVENLABS_API_KEY
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY missing — expected in service/.env.local')
  process.exit(1)
}

// User-supplied custom voice (locally named "Michael", library name "Snap").
const MICHAEL = 'gWaDC0oXAheKoZfljzuI'
// User-side voice — "Alexandra - Conversational and Real" from same library.
const ALEXANDRA = 'kdmDKE6EkgrWrrykO9Qt'

interface Clip {
  filename: string
  role: 'agent' | 'user'
  voiceId: string
  text: string
  settings?: Partial<VoiceSettings>
}

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

// Default settings — agent reads punchy/excited (matches Snap voice character);
// user reads casual/natural (matches Alexandra). Per-clip overrides below.
const AGENT_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.78,
  style: 0.35,
  use_speaker_boost: true,
}
const USER_SETTINGS: VoiceSettings = {
  stability: 0.55,
  similarity_boost: 0.75,
  style: 0.2,
  use_speaker_boost: true,
}

// Numbers spelled out so the TTS reads them naturally ("twelve eighty-four"
// not "one comma two eight four"). Em-dashes drive micro-pauses.
const CLIPS: Clip[] = [
  // Scene 2 — Morning Brief
  {
    filename: '02a-user-brief.mp3',
    role: 'user', voiceId: ALEXANDRA,
    text: 'Morning. How we looking?',
  },
  {
    filename: '02b-agent-brief.mp3',
    role: 'agent', voiceId: MICHAEL,
    text: "Up twelve eighty-four across the book. Nvidia leading on the cloud capex print.",
  },
  // Scene 3 — Ticker pull
  {
    filename: '03a-user-ticker.mp3',
    role: 'user', voiceId: ALEXANDRA,
    text: "What's Nvidia doing?",
  },
  {
    filename: '03b-agent-ticker.mp3',
    role: 'agent', voiceId: MICHAEL,
    text: "Up four-nine on the day. You're long thirty — sitting on six-twelve.",
  },
  // Scene 4 — Voice trade
  {
    filename: '04a-user-buy.mp3',
    role: 'user', voiceId: ALEXANDRA,
    text: 'Buy ten shares of Microsoft.',
  },
  {
    filename: '04b-agent-readback.mp3',
    role: 'agent', voiceId: MICHAEL,
    text: 'Ten Microsoft at market, about forty-two oh-five. Confirm?',
  },
  {
    filename: '04c-user-confirm.mp3',
    role: 'user', voiceId: ALEXANDRA,
    text: 'Confirm.',
  },
  {
    filename: '04d-agent-filled.mp3',
    role: 'agent', voiceId: MICHAEL,
    text: 'Filled — ten at four-twenty fifty.',
  },
]

const OUT_DIR = resolve(import.meta.dir, '../../app/public/vo')
await mkdir(OUT_DIR, { recursive: true })

// Clean out any old clips (e.g. previous narrator versions) so the directory
// only contains current dialog clips.
const existing = await readdir(OUT_DIR).catch(() => [] as string[])
for (const f of existing) {
  if (f.endsWith('.mp3')) await unlink(`${OUT_DIR}/${f}`).catch(() => {})
}

const MODEL_ID = 'eleven_multilingual_v2'

let totalBytes = 0
const start = performance.now()
const results: Array<{ filename: string; bytes: number; estSec: number; text: string }> = []

for (const clip of CLIPS) {
  const base = clip.role === 'agent' ? AGENT_SETTINGS : USER_SETTINGS
  const settings = { ...base, ...(clip.settings ?? {}) }
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${clip.voiceId}?output_format=mp3_44100_128`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: clip.text,
      model_id: MODEL_ID,
      voice_settings: settings,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '<no body>')
    console.error(`✗ ${clip.filename} → ${res.status} ${res.statusText}`)
    console.error(body)
    process.exit(1)
  }

  const buf = new Uint8Array(await res.arrayBuffer())
  const path = `${OUT_DIR}/${clip.filename}`
  await mkdir(dirname(path), { recursive: true })
  await Bun.write(path, buf)
  totalBytes += buf.byteLength
  // mp3 at 128 kbps ≈ 16 KB / sec — close enough to schedule beats.
  const estSec = buf.byteLength / 16384
  results.push({ filename: clip.filename, bytes: buf.byteLength, estSec, text: clip.text })
  console.log(
    `✓ ${clip.filename.padEnd(28)} ${clip.role.padEnd(5)} ${(buf.byteLength / 1024).toFixed(1).padStart(6)} kb  ~${estSec.toFixed(2)}s  "${clip.text}"`,
  )
}

const elapsedSec = ((performance.now() - start) / 1000).toFixed(1)
console.log(
  `\nGenerated ${CLIPS.length} clips · ${(totalBytes / 1024).toFixed(1)} kb total · ${elapsedSec}s`,
)
console.log(`Output: ${OUT_DIR}`)
console.log(
  `\nApprox per-clip durations (use to set vo-clips.ts delays + timeline.ts scene lengths):`,
)
for (const r of results) {
  console.log(`  ${r.filename.padEnd(28)} ~${r.estSec.toFixed(2)}s`)
}
