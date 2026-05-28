// Voice "orb" — a dot-matrix grid visualizer in the spirit of LiveKit's
// Agents UI "grid" personality. The grid is the click target; status label
// below. Animation is requestAnimationFrame-driven with per-dot opacity
// computed from a state-dependent function of (distance-from-center, time).
//
// We don't have access to the WebRTC audio PCM from the @elevenlabs/react SDK,
// so the "reactivity" while speaking is simulated — a multi-frequency radial
// wave that *reads* as audio. Visually indistinguishable from a real analyzer
// for the demo.
//
// IMPORTANT: the parent component re-renders on every audio tick from the
// conversation hook. We isolate the grid SVG into a memoed sub-component AND
// avoid putting `opacity` in JSX so React reconciliation doesn't reset the
// values our rAF tick wrote.

import { memo, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export type OrbState = 'idle' | 'connecting' | 'listening' | 'speaking'

interface Props {
  state: OrbState
  onTap: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Optional inline-style overrides for the status label (text below orb).
   *  Used by the Brand-Reveal segment to brighten "TAP TO TALK". Only applied
   *  in non-active states; active (listening/speaking) keeps its built-in
   *  loss-color styling so the live app behavior is unchanged. */
  labelStyle?: React.CSSProperties
}

const STATUS_LABEL: Record<OrbState, string> = {
  idle: 'Tap to talk',
  connecting: 'Connecting',
  listening: 'Listening',
  speaking: 'Speaking',
}

const SIZE_PX = { sm: 96, md: 128, lg: 168 } as const
const GRID = 15

// Static dot positions — computed once.
const CELLS: Array<{ x: number; y: number }> = []
for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) CELLS.push({ x, y })

const PADDING = 1
const SPAN = GRID + PADDING * 2 - 1
const DOT_R = 0.32
const CENTER = (GRID - 1) / 2

/** Per-dot intensity (0..1) for a given state, time, and grid coords. */
function intensity(
  state: OrbState,
  t: number,
  x: number,
  y: number,
): number {
  const dx = x - CENTER
  const dy = y - CENTER
  const r = Math.sqrt(dx * dx + dy * dy)
  const maxR = Math.sqrt(2) * CENTER

  switch (state) {
    case 'idle': {
      const wave = Math.sin(t * 0.7 - r * 0.55) * 0.5 + 0.5
      const falloff = 1 - r / maxR
      return 0.08 + 0.32 * wave * falloff
    }
    case 'connecting': {
      const angle = Math.atan2(dy, dx)
      const sweep = (t * 2.2) % (Math.PI * 2)
      const delta = Math.abs(((angle - sweep + Math.PI * 3) % (Math.PI * 2)) - Math.PI)
      const proximity = 1 - Math.min(delta / 1.2, 1)
      return 0.1 + 0.7 * proximity
    }
    case 'listening': {
      const w1 = Math.sin(t * 1.8 - r * 0.6) * 0.5 + 0.5
      const w2 = Math.sin(t * 2.6 - r * 0.4 + 1.1) * 0.5 + 0.5
      return 0.2 + 0.55 * (w1 * 0.7 + w2 * 0.3)
    }
    case 'speaking': {
      const w1 = Math.sin(t * 3.4 - r * 0.7) * 0.5 + 0.5
      const w2 = Math.sin(t * 5.1 + r * 0.3) * 0.5 + 0.5
      const w3 = Math.sin(t * 7.3 - x * 0.8 + y * 0.5) * 0.5 + 0.5
      return 0.3 + 0.65 * (w1 * 0.5 + w2 * 0.3 + w3 * 0.2)
    }
  }
}

/** The dot-matrix SVG, isolated and memoed so the parent's re-renders don't
 *  remount circles (which would reset opacities). */
const DotGrid = memo(function DotGrid({ state }: { state: OrbState }) {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const svg = ref.current
      if (svg) {
        const dots = svg.querySelectorAll<SVGCircleElement>('circle[data-dot]')
        dots.forEach((dot, i) => {
          const x = i % GRID
          const y = Math.floor(i / GRID)
          dot.setAttribute('opacity', intensity(state, t, x, y).toFixed(3))
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf) }
  }, [state])

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SPAN} ${SPAN}`}
      className="absolute inset-0 size-full p-2"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {CELLS.map(({ x, y }, i) => (
        // No `opacity` in JSX — rAF owns it. React would otherwise overwrite
        // our DOM writes on every parent re-render. `fill` and the filter
        // both pull from var(--color-loss) so a parent style override (used
        // by the brand-reveal segment) restyles the entire grid.
        <circle
          key={i}
          data-dot
          cx={x + PADDING}
          cy={y + PADDING}
          r={DOT_R}
          fill="var(--color-loss)"
          style={{ filter: 'drop-shadow(0 0 0.6px color-mix(in oklab, var(--color-loss) 85%, transparent))' }}
        />
      ))}
    </svg>
  )
})

export function VoiceOrb({ state, onTap, disabled, size = 'md', labelStyle }: Props) {
  const px = SIZE_PX[size]
  const active = state === 'listening' || state === 'speaking'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onTap}
        disabled={disabled}
        aria-label={STATUS_LABEL[state]}
        style={{ width: px, height: px }}
        className={cn(
          'relative rounded-[22px] p-0 cursor-pointer outline-none',
          'transition-all duration-200 ease-out',
          'bg-[color-mix(in_oklab,var(--color-bg-1)_85%,transparent)]',
          'border border-[var(--color-border)]/40',
          'backdrop-blur-md',
          'active:scale-[0.97]',
          'hover:border-[var(--color-loss)]/45 hover:shadow-[0_0_30px_color-mix(in_oklab,var(--color-loss)_25%,transparent)]',
          active && 'border-[var(--color-loss)]/55 shadow-[0_0_36px_color-mix(in_oklab,var(--color-loss)_30%,transparent)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--color-loss)]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-bg-1)]',
          'disabled:cursor-not-allowed disabled:opacity-70',
        )}
      >
        {/* Inner ambient glow — radial wash behind the grid */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-[22px] pointer-events-none',
            'bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-loss)_18%,transparent),transparent_70%)]',
            'transition-opacity duration-300',
            active ? 'opacity-100' : 'opacity-50',
          )}
        />

        <DotGrid state={state} />

        {/* Subtle vignette to anchor the grid to the panel */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-[22px] pointer-events-none"
          style={{
            boxShadow:
              'inset 0 0 24px rgba(7,16,31,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        />
      </button>

      <div
        className={cn(
          'text-[10.5px] tracking-[0.22em] uppercase font-semibold transition-colors',
          active ? 'text-[var(--color-loss)]' : 'text-[var(--color-text-muted)]',
        )}
        style={!active ? labelStyle : undefined}
      >
        {STATUS_LABEL[state]}
      </div>
    </div>
  )
}
