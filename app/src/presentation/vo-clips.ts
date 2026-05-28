// Voiceover clip registry — pure dialog. Delays mirror each scene's internal
// beat machine so the orb's listening/speaking state and the spoken audio
// hit on the same frame.

import type { SceneId } from './timeline'

export interface VOClip {
  id: string
  src: string
  /** ms after scene mount to fire playback. */
  delayMs?: number
}

export const VO_CLIPS_BY_SCENE: Record<SceneId, VOClip[]> = {
  hero: [],

  brief: [
    { id: 'user',  src: '/vo/02a-user-brief.mp3',  delayMs: 300 },
    // Agent fires ~2000ms in — gives a natural 700ms pause after the user
    // finishes "Morning. How we looking?" before the agent answers.
    { id: 'agent', src: '/vo/02b-agent-brief.mp3', delayMs: 2000 },
  ],

  ticker: [
    { id: 'user',  src: '/vo/03a-user-ticker.mp3',  delayMs: 300 },
    { id: 'agent', src: '/vo/03b-agent-ticker.mp3', delayMs: 2100 },
  ],

  trade: [
    // Full four-line back-and-forth aligned with the TradeScene stage machine.
    { id: 'user-buy',      src: '/vo/04a-user-buy.mp3',      delayMs:  300 },
    { id: 'agent-readback', src: '/vo/04b-agent-readback.mp3', delayMs: 2200 },
    { id: 'user-confirm',   src: '/vo/04c-user-confirm.mp3',   delayMs: 6000 },
    { id: 'agent-filled',   src: '/vo/04d-agent-filled.mp3',   delayMs: 7000 },
  ],

  elevenlabs: [],
  outro: [],
}
