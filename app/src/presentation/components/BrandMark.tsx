// AgentTrader wordmark with the teal accent dot. Used in Hero + Outro.

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Props {
  size?: 'lg' | 'xl'
  className?: string
  delay?: number
}

const SIZES = {
  lg: 'text-5xl md:text-6xl',
  xl: 'text-6xl md:text-7xl lg:text-8xl',
} as const

export function BrandMark({ size = 'xl', className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, letterSpacing: '0.08em' }}
      animate={{
        opacity: 1,
        y: 0,
        letterSpacing: '-0.02em',
        transition: { delay, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
      }}
      className={cn(
        'font-semibold tracking-tight text-[var(--color-text)] flex items-baseline gap-2',
        SIZES[size],
        className,
      )}
    >
      <span>AgentTrader</span>
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          transition: { delay: delay + 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
        className="inline-block size-2 md:size-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_18px_var(--color-accent)]"
      />
    </motion.div>
  )
}
