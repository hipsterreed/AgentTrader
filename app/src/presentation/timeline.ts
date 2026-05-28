// Scene sequence + durations — paced to dialog timing. Each Brief/Ticker/Trade
// scene runs an internal beat machine (user listens → agent speaks → cards
// animate) so the audio and the visuals land together.

import type { SceneDef } from './hooks/useTimeline'

export const SCENE_IDS = ['hero', 'brief', 'ticker', 'trade', 'elevenlabs', 'outro'] as const
export type SceneId = (typeof SCENE_IDS)[number]

export const TIMELINE: SceneDef[] = [
  { id: 'hero',       durationMs:  3200 },
  { id: 'brief',      durationMs:  7400 },
  { id: 'ticker',     durationMs:  7000 },
  { id: 'trade',      durationMs: 10300 },
  { id: 'elevenlabs', durationMs:  3500 },
  { id: 'outro',      durationMs:  3500 },
]

export const TOTAL_MS = TIMELINE.reduce((acc, s) => acc + s.durationMs, 0) // ~34900ms
