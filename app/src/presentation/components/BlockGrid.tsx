// Floor-of-tiles background — inspiration: synthio landing.png. A grid of
// translucent rounded glass blocks tinted by a brand-color gradient, fading
// out toward the top. Used as the Brand-Reveal segment backdrop.
//
// Animation: every tile runs a ripple keyframe with a delay computed from its
// diagonal position, so a single continuous wave washes across the floor
// bottom-left → top-right. ~30% of tiles are "spark" tiles — magenta/pink with
// a bigger pulse amplitude — so they catch the eye as the wave hits them.
// All animations share the same cycle length, so the loop closes seamlessly
// for GIF capture.

import { useMemo } from 'react'

interface Props {
  /** Height of the floor as % of container (default 65) */
  heightPct?: number
  rows?: number
  cols?: number
  /** Bottom padding in px before the tiles start (default 32) */
  padPx?: number
  /** Total wave cycle in seconds — also the natural loop length (default 3.6) */
  rippleSec?: number
  /** Fraction of tiles that are bright magenta "spark" highlights (default 0.3) */
  sparkRatio?: number
}

// Stable per-tile pseudo-random in [0,1].
function hash(r: number, c: number, salt = 0): number {
  const v = ((r * 73856093) ^ (c * 19349663) ^ (salt * 83492791)) >>> 0
  return (v % 10000) / 10000
}

export function BlockGrid({
  heightPct = 65,
  rows = 7,
  cols = 16,
  padPx = 32,
  rippleSec = 3.6,
  sparkRatio = 0.3,
}: Props) {
  const tiles = useMemo(() => {
    // Bottom-left → top-right diagonal weighting. Bottom rows fire first so
    // the wave rolls upward against the Ken Burns push — feels like the floor
    // is reacting to the camera move.
    const ROW_WEIGHT = 1.2
    const COL_WEIGHT = 1.0
    const maxWavePos = (rows - 1) * ROW_WEIGHT + (cols - 1) * COL_WEIGHT

    const out: Array<{
      r: number; c: number; hue: number; sat: number; light: number;
      alpha: number; delay: number; spark: boolean;
    }> = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c / Math.max(cols - 1, 1)
        const ty = r / Math.max(rows - 1, 1)

        const spark = hash(r, c, 4) < sparkRatio

        let hue: number, sat: number, light: number, baseAlpha: number
        if (spark) {
          // Spark tiles — magenta/pink range (295–335°). Cranked saturation
          // and lightness so they read as neon glass against the cool tiles.
          hue = 295 + hash(r, c, 5) * 40
          sat = 90 + hash(r, c, 6) * 10               // 90–100
          light = 65 + hash(r, c, 8) * 7              // 65–72
          baseAlpha = 0.28 + hash(r, c) * 0.34
        } else {
          // Cool tiles — teal (170°) → cyan (210°) → indigo (245°) diagonal.
          // Bumped saturation and base alpha vs. v1 so the wave reads more.
          hue = 170 + tx * 40 + ty * 35
          sat = 78 + hash(r, c, 1) * 22               // 78–100
          light = 52 + ty * 14                        // 52–66
          baseAlpha = 0.13 + hash(r, c) * 0.32
        }
        // Tiles toward the bottom are more solid (anchors composition).
        const alpha = baseAlpha * (0.55 + ty * 0.55)

        // Wave position runs bottom→top, left→right.
        const wavePos = (rows - 1 - r) * ROW_WEIGHT + c * COL_WEIGHT
        const delay = (wavePos / maxWavePos) * rippleSec
        // Small per-tile jitter so the wave breathes instead of marching.
        const jitter = (hash(r, c, 7) - 0.5) * 0.08

        out.push({ r, c, hue, sat, light, alpha, spark, delay: delay + jitter })
      }
    }
    return out
  }, [rows, cols, rippleSec, sparkRatio])

  // Mask softens the top edge so tiles dissolve into the scene rather than
  // ending in a hard line.
  const MASK = 'linear-gradient(to top, black 60%, transparent 100%)'

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden z-0"
      style={{ height: `${heightPct}%` }}
    >
      {/* Layered color wash behind the tiles — teal on the left, magenta-pink
          spotlight bottom-right, deep blue floor. Gives the floor real depth
          and a strong color story before any tile renders. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 70% at 15% 100%, color-mix(in oklab, var(--color-accent) 38%, transparent), transparent 60%), ' +
            'radial-gradient(ellipse 60% 70% at 90% 100%, color-mix(in oklab, var(--color-loss) 36%, transparent), transparent 60%), ' +
            'radial-gradient(ellipse 80% 60% at 50% 100%, color-mix(in oklab, var(--color-accent-2) 22%, transparent), transparent 70%), ' +
            'linear-gradient(to top, color-mix(in oklab, var(--color-accent-deep) 40%, transparent), transparent 75%)',
          maskImage: MASK,
          WebkitMaskImage: MASK,
        }}
      />

      {/* Tile grid */}
      <div
        className="absolute inset-x-0 bottom-0 grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: '10px',
          padding: `0 ${padPx}px ${padPx}px ${padPx}px`,
          height: '92%',
          maskImage: MASK,
          WebkitMaskImage: MASK,
        }}
      >
        {tiles.map((t) => (
          <div
            key={`${t.r}-${t.c}`}
            className="rounded-xl border"
            style={{
              backgroundColor: `hsla(${t.hue}, ${t.sat}%, ${t.light}%, ${t.alpha})`,
              borderColor: `hsla(${t.hue}, ${t.sat}%, ${t.light + 20}%, ${t.alpha * (t.spark ? 1 : 0.65)})`,
              boxShadow: t.spark
                ? `0 10px 22px hsla(${t.hue}, ${t.sat}%, 40%, ${t.alpha * 0.85}), 0 0 20px hsla(${t.hue}, ${t.sat}%, 65%, ${t.alpha * 0.7}), inset 0 1px 0 hsla(${t.hue}, 70%, 90%, ${t.alpha * 0.65})`
                : `0 8px 16px hsla(${t.hue}, ${t.sat}%, 28%, ${t.alpha * 0.6}), 0 0 12px hsla(${t.hue}, ${t.sat}%, 55%, ${t.alpha * 0.35}), inset 0 1px 0 hsla(${t.hue}, 70%, 85%, ${t.alpha * 0.45})`,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: `${t.spark ? 'block-spark' : 'block-ripple'} ${rippleSec}s ease-in-out infinite`,
              animationDelay: `${t.delay}s`,
              willChange: 'transform, filter',
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
    </div>
  )
}
