// Marketing-video presentation root. Auto-advances through TIMELINE scenes,
// crossfading via AnimatePresence. Recording escape hatches:
//   Space — pause / resume
//   R     — restart from t=0
//   ←/→   — jump scene
//   C     — toggle captions
//   H     — toggle progress bar / shortcut hint
// Visit at http://localhost:5173/#/present

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Volume2, VolumeX } from 'lucide-react'

import { AmbientGrid } from '@/components/ambient-grid'
import { SCENE_IDS, TIMELINE, TOTAL_MS, type SceneId } from './timeline'
import { useTimeline } from './hooks/useTimeline'
import { useVoiceover } from './hooks/useVoiceover'
import { VO_CLIPS_BY_SCENE } from './vo-clips'
import { ProgressBar } from './components/ProgressBar'
import { Flash } from './components/Flash'

import { HeroScene } from './scenes/HeroScene'
import { BriefScene } from './scenes/BriefScene'
import { TickerScene } from './scenes/TickerScene'
import { TradeScene } from './scenes/TradeScene'
import { ElevenLabsScene } from './scenes/ElevenLabsScene'
import { OutroScene } from './scenes/OutroScene'

// Inline switch (rather than a registry map) so each scene element is created
// with a literal `key` prop set inside the JSX — AnimatePresence relies on
// React keys to detect mount/unmount on its direct child, and indirection
// through a higher-order helper would break that key tracking.
function renderScene(id: SceneId, showCaptions: boolean) {
  switch (id) {
    case 'hero':       return <HeroScene key="hero" />
    case 'brief':      return <BriefScene key="brief" showCaptions={showCaptions} />
    case 'ticker':     return <TickerScene key="ticker" showCaptions={showCaptions} />
    case 'trade':      return <TradeScene key="trade" showCaptions={showCaptions} />
    case 'elevenlabs': return <ElevenLabsScene key="elevenlabs" />
    case 'outro':      return <OutroScene key="outro" />
  }
}

export function Presentation() {
  const tl = useTimeline(TIMELINE, { autoLoop: true })
  const [showCaptions, setShowCaptions] = useState(true)
  const [showChrome, setShowChrome] = useState(true)
  const [voEnabled, setVoEnabled] = useState(false)

  const currentSceneId = SCENE_IDS[tl.currentIndex]

  // Voiceover playback — fires per-scene clips at their declared delays.
  useVoiceover({
    currentSceneId,
    clipsBySceneId: VO_CLIPS_BY_SCENE,
    enabled: voEnabled,
  })

  // Keyboard shortcuts for take-control while recording.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing somewhere — defensive even though we have no inputs.
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      switch (e.key) {
        case ' ': e.preventDefault(); tl.toggle(); break
        case 'r': case 'R': tl.restart(); break
        case 'ArrowRight': tl.next(); break
        case 'ArrowLeft': tl.prev(); break
        case 'c': case 'C': setShowCaptions((s) => !s); break
        case 'h': case 'H': setShowChrome((s) => !s); break
        case 'v': case 'V': setVoEnabled((s) => !s); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tl])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-bg-1)]">
      {/* Ambient backdrop, persistent across scenes — anchors the visual brand */}
      <AmbientGrid />

      {/* Always-moving radial wash so the background never feels static even
          when a scene is holding its pose. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--color-accent-deep) 35%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 65%), radial-gradient(ellipse 50% 40% at 0% 100%, color-mix(in oklab, var(--color-accent-2) 10%, transparent), transparent 65%)',
          backgroundSize: '200% 200%',
        }}
      />

      {/* Scene-change punctuation — fires a brief teal flash on every cut */}
      <Flash triggerKey={currentSceneId} />

      <ProgressBar getElapsedMs={tl.getElapsedMs} totalMs={TOTAL_MS} show={showChrome} />

      {/* Stage — AnimatePresence handles crossfade between sibling scenes.
          The direct child MUST be a motion component (SceneFrame is one) with
          a unique `key` so AnimatePresence can match mount/unmount cycles. */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait" initial={false}>
          {renderScene(currentSceneId, showCaptions)}
        </AnimatePresence>
      </div>

      {/* Recording chrome — bottom-right hint, hidden by Sonner toaster's z layer */}
      {showChrome && (
        <div className="pointer-events-none absolute bottom-3 right-4 z-40 flex flex-col items-end gap-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-dim)] font-semibold opacity-60">
          <div className="flex items-center gap-3">
            {voEnabled ? (
              <span className="flex items-center gap-1 text-[var(--color-accent)]">
                <Volume2 className="size-3" />
                VO
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <VolumeX className="size-3" />
                muted
              </span>
            )}
            <span>
              {tl.isPaused ? 'paused' : `scene ${tl.currentIndex + 1}/${TIMELINE.length}`}
            </span>
          </div>
          <div className="text-[9px] normal-case tracking-normal opacity-70">
            space · pause &nbsp; r · restart &nbsp; ←/→ · jump &nbsp; c · captions &nbsp; v · voiceover &nbsp; h · chrome
          </div>
        </div>
      )}
    </div>
  )
}
