// Lower-third subtitle: a hint of what the voiceover would say. Soft styling
// so it never competes with the product. Toggleable via the `C` key in
// Presentation (so you can record a clean-no-caption pass too).

import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Props {
  text?: string
  show?: boolean
  variant?: 'user' | 'agent'
  className?: string
}

export function Caption({ text, show = true, variant = 'user', className }: Props) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-center px-6',
        className,
      )}
    >
      <AnimatePresence mode="wait">
        {show && text && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
            className={cn(
              'max-w-[42rem] rounded-full px-5 py-2.5 text-center text-sm font-medium tracking-tight backdrop-blur-md',
              variant === 'user'
                ? 'bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] text-[var(--color-text)] border border-[var(--color-border)]/50'
                : 'bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-text)] border border-[var(--color-accent)]/30',
            )}
          >
            <span className="opacity-70 mr-2 text-[11px] uppercase tracking-[0.18em]">
              {variant === 'user' ? 'You' : 'Agent'}
            </span>
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
