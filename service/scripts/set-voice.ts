// One-shot: update the Speech Engine's TTS voice.
// Usage:  bun run scripts/set-voice.ts <voice_id>
//   e.g.  bun run scripts/set-voice.ts gWaDC0oXAheKoZfljzuI

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const voiceId = process.argv[2];
if (!voiceId) {
  console.error("Usage: bun run scripts/set-voice.ts <voice_id>");
  process.exit(1);
}

const { ELEVENLABS_API_KEY, SPEECH_ENGINE_ID } = process.env;
if (!ELEVENLABS_API_KEY) throw new Error("Missing ELEVENLABS_API_KEY");
if (!SPEECH_ENGINE_ID) throw new Error("Missing SPEECH_ENGINE_ID");

const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

const updated = await elevenlabs.speechEngine.update(SPEECH_ENGINE_ID, {
  tts: { voiceId },
});

console.log(`[ok] engine ${SPEECH_ENGINE_ID} voice_id → ${voiceId}`);
console.log(`[info] engine name: ${updated.name ?? "(unnamed)"}`);
console.log(
  `[next] restart conversation in the browser to hear the new voice — no service restart needed (config is fetched live on each session).`,
);
