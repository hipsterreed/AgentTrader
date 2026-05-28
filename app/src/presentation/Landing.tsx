// Public-facing home page. Same visual composition as Broll segment 1
// (brand wordmark + orb + cube floor + side cards + particles) but with no
// recording chrome, no segment navigation, and the Get Started button on
// the orb takes the visitor to the live agent at #/agent.

import { motion } from 'motion/react'
import { AmbientGrid } from '@/components/ambient-grid'
import { BlockGrid } from './components/BlockGrid'
import { SideCards } from './components/SideCards'
import { BrandRevealSegment } from './broll-scenes/BrandRevealSegment'

export function Landing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-bg-1)]">
      <AmbientGrid />

      {/* Slow pan background — matches the trailer's always-moving feel */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
        transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--color-accent-deep) 35%, transparent), transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 65%)',
          backgroundSize: '200% 200%',
        }}
      />

      <BlockGrid heightPct={65} />
      <SideCards />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-5xl flex items-center justify-center">
          <BrandRevealSegment loopKey={0} />
        </div>
      </div>
    </div>
  )
}
