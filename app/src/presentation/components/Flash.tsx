// Brief full-screen color flash fired at every scene change. The white/teal
// punch is the visual equivalent of a snare hit between scenes — it sells the
// edit even when the underlying motion is restrained.

import { AnimatePresence, motion } from 'motion/react'

interface Props {
  /** Bumps trigger a flash; pass the current scene index. */
  triggerKey: string | number
  color?: string
}

export function Flash({ triggerKey, color = 'color-mix(in oklab, var(--color-accent) 38%, white)' }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden mix-blend-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={triggerKey}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const } }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: color }}
        />
      </AnimatePresence>
    </div>
  )
}
