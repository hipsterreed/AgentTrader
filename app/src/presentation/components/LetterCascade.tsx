// Kinetic typography — each character snaps in with a tight stagger. Reads as
// hand-keyed motion graphics, not "the text fades in."

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  className?: string
  /** Seconds between each character */
  stagger?: number
  /** Initial delay before the first character */
  delay?: number
  /** Per-character animation duration */
  duration?: number
}

export function LetterCascade({
  text,
  className,
  stagger = 0.025,
  delay = 0,
  duration = 0.42,
}: Props) {
  // Preserve whitespace by emitting non-breaking spaces as their own spans
  // (motion can't animate text nodes, only elements).
  const chars = Array.from(text)
  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={{ y: '0.6em', opacity: 0, filter: 'blur(6px)' }}
          animate={{
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            transition: {
              delay: delay + i * stagger,
              duration,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          style={{ whiteSpace: 'pre' }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}
