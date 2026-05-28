// Floating glass embers that drift around the viewport in organic, looping
// paths. Adds depth between the cube floor and the focal wordmark/orb.
//
// Each particle has its own stable random spawn point, drift path, size, and
// timing — computed once via useMemo and seeded by index so HMR doesn't
// reshuffle on every edit. Motion uses keyframe arrays so each particle
// breathes in a different direction (no marching-up-in-lines).

import { motion } from 'motion/react'
import { useMemo } from 'react'

interface Props {
  count?: number
}

function rng(seed: number): number {
  const v = (seed * 9301 + 49297) % 233280
  return v / 233280
}

export function Particles({ count = 12 }: Props) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = (n: number) => rng(i * 17 + n)
      const isPink = r(1) < 0.5
      // Drift up to ±140px in either axis. Two-leg path so motion feels
      // organic — not a straight line, but a wandering loop.
      const driftAx = (r(2) - 0.5) * 280
      const driftAy = (r(3) - 0.5) * 280
      const driftBx = (r(4) - 0.5) * 280
      const driftBy = (r(5) - 0.5) * 280
      return {
        id: i,
        leftPct: 8 + r(6) * 84,                 // spawn 8–92% across width
        topPct: 15 + r(7) * 70,                 // 15–85% down (avoid extremes)
        sizePx: 3 + r(8) * 4,                   // 3–7 px
        durationSec: 12 + r(9) * 10,            // 12–22 s per loop
        delaySec: -(r(10) * 22),                // negative = phase offset
        driftAx, driftAy, driftBx, driftBy,
        color: isPink ? '#FF6FBE' : '#5EEAD4',
        glow: isPink ? 'rgba(255,111,190,0.7)' : 'rgba(94,234,212,0.7)',
      }
    })
  }, [count])

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          animate={{
            x: [0, p.driftAx, p.driftBx, 0],
            y: [0, p.driftAy, p.driftBy, 0],
            opacity: [0, 0.85, 0.85, 0],
            scale: [0.6, 1, 1, 0.6],
          }}
          transition={{
            duration: p.durationSec,
            delay: p.delaySec,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.25, 0.75, 1],
          }}
          style={{
            position: 'absolute',
            top: `${p.topPct}%`,
            left: `${p.leftPct}%`,
            width: `${p.sizePx}px`,
            height: `${p.sizePx}px`,
            borderRadius: '9999px',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.sizePx * 3}px ${p.glow}, 0 0 ${p.sizePx * 6}px ${p.glow}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}
