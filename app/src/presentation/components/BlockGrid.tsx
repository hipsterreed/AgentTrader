// Floor-of-tiles background — inspiration: synthio landing.png. A grid of
// translucent rounded glass blocks tinted by a brand-color gradient, fading
// out toward the top. Used as the Brand-Reveal segment backdrop.

import { useMemo } from 'react'

interface Props {
  /** Height of the floor as % of container (default 65) */
  heightPct?: number
  rows?: number
  cols?: number
  /** Bottom padding in px before the tiles start (default 32) */
  padPx?: number
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
}: Props) {
  const tiles = useMemo(() => {
    const out: Array<{
      r: number; c: number; hue: number; sat: number; light: number;
      alpha: number; pulse: boolean; delay: number;
    }> = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c / Math.max(cols - 1, 1)
        const ty = r / Math.max(rows - 1, 1)
        // Hue lerps along the diagonal: teal (175°) → cyan (195°) → indigo (235°)
        const hue = 175 + tx * 35 + ty * 20
        const sat = 65 + hash(r, c, 1) * 25      // 65–90
        const light = 50 + ty * 12               // 50–62
        // Tiles toward the bottom are more solid (anchors composition).
        const baseAlpha = 0.07 + hash(r, c) * 0.28
        const alpha = baseAlpha * (0.55 + ty * 0.55)
        out.push({
          r, c, hue, sat, light, alpha,
          pulse: hash(r, c, 2) > 0.78,           // ~22% of tiles breathe
          delay: hash(r, c, 3) * 5,
        })
      }
    }
    return out
  }, [rows, cols])

  // Mask softens the top edge so tiles dissolve into the scene rather than
  // ending in a hard line.
  const MASK = 'linear-gradient(to top, black 55%, transparent 100%)'

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden z-0"
      style={{ height: `${heightPct}%` }}
    >
      {/* Soft colored wash behind the tiles — gives the floor its depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 22%, transparent) 0%, transparent 55%), ' +
            'linear-gradient(225deg, color-mix(in oklab, var(--color-accent-2) 18%, transparent) 0%, transparent 60%), ' +
            'linear-gradient(to top, color-mix(in oklab, var(--color-accent-deep) 28%, transparent), transparent 70%)',
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
              borderColor: `hsla(${t.hue}, ${t.sat}%, ${t.light + 18}%, ${t.alpha * 0.55})`,
              boxShadow: `0 6px 14px hsla(${t.hue}, ${t.sat}%, 25%, ${t.alpha * 0.5}), inset 0 1px 0 hsla(${t.hue}, 70%, 85%, ${t.alpha * 0.35})`,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: t.pulse ? 'block-pulse 5.5s ease-in-out infinite' : undefined,
              animationDelay: t.pulse ? `${t.delay}s` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  )
}
