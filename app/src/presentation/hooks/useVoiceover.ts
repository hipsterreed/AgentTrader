// Voiceover playback hook. On each scene change, schedules that scene's clips
// at their declared offsets via setTimeout, and cancels everything (timers +
// in-flight audio) on cleanup so jumping scenes never leaks overlapping VO.
//
// Audio elements are cached per-src so re-playing a clip is instant. Browser
// autoplay policy: the first play after a user gesture (key press, click)
// unlocks subsequent plays in the same session.

import { useEffect, useRef } from 'react'
import type { VOClip } from '../vo-clips'
import type { SceneId } from '../timeline'

interface Options {
  currentSceneId: SceneId
  clipsBySceneId: Record<SceneId, VOClip[]>
  enabled: boolean
  /** Force-restart key — bump this to retrigger the current scene's clips. */
  restartKey?: number
}

export function useVoiceover({ currentSceneId, clipsBySceneId, enabled, restartKey }: Options) {
  const cacheRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const playingRef = useRef<HTMLAudioElement[]>([])

  useEffect(() => {
    if (!enabled) return

    const timers: ReturnType<typeof setTimeout>[] = []
    const clips = clipsBySceneId[currentSceneId] ?? []

    for (const clip of clips) {
      const t = setTimeout(() => {
        let audio = cacheRef.current.get(clip.src)
        if (!audio) {
          audio = new Audio(clip.src)
          audio.preload = 'auto'
          cacheRef.current.set(clip.src, audio)
        }
        audio.currentTime = 0
        playingRef.current.push(audio)
        audio.play().catch((err) => {
          // Autoplay can fail before any user gesture. Log once; user can
          // press V again or tap the page to enable.
          console.warn(`[vo] play blocked for ${clip.src}:`, err?.message ?? err)
        })
      }, clip.delayMs ?? 0)
      timers.push(t)
    }

    return () => {
      for (const t of timers) clearTimeout(t)
      for (const a of playingRef.current) {
        if (!a.paused) {
          a.pause()
          a.currentTime = 0
        }
      }
      playingRef.current = []
    }
  }, [currentSceneId, enabled, clipsBySceneId, restartKey])

  // Disabling mid-clip should stop audio immediately too.
  useEffect(() => {
    if (enabled) return
    for (const a of playingRef.current) {
      if (!a.paused) {
        a.pause()
        a.currentTime = 0
      }
    }
    playingRef.current = []
  }, [enabled])
}
