// Per-scene transition wrapper. Each scene picks a `transition` style so the
// cuts have variety — push, zoom, slide, fade. AnimatePresence in mode="wait"
// runs the previous scene's exit before the new scene's enter; combined with
// the global Flash overlay, the result reads as a snappy hard cut rather than
// a slow crossfade.

import { motion, type Transition, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TransitionStyle = 'fade' | 'push-up' | 'push-down' | 'push-left' | 'push-right' | 'zoom-in' | 'zoom-out' | 'snap'

interface Props {
  children: ReactNode
  className?: string
  transition?: TransitionStyle
}

const SOFT: Transition = { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const }
const QUICK: Transition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }
const SNAP: Transition = { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const }

const VARIANTS: Record<TransitionStyle, Variants> = {
  fade: {
    initial: { opacity: 0, scale: 1.03, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: SOFT },
    exit:    { opacity: 0, scale: 0.985, filter: 'blur(6px)', transition: QUICK },
  },
  'push-up': {
    initial: { y: '8%', opacity: 0, scale: 1.04 },
    animate: { y: 0, opacity: 1, scale: 1, transition: QUICK },
    exit:    { y: '-6%', opacity: 0, scale: 0.99, transition: SNAP },
  },
  'push-down': {
    initial: { y: '-8%', opacity: 0, scale: 1.04 },
    animate: { y: 0, opacity: 1, scale: 1, transition: QUICK },
    exit:    { y: '6%', opacity: 0, scale: 0.99, transition: SNAP },
  },
  'push-left': {
    initial: { x: '8%', opacity: 0, scale: 1.02 },
    animate: { x: 0, opacity: 1, scale: 1, transition: QUICK },
    exit:    { x: '-6%', opacity: 0, scale: 0.99, transition: SNAP },
  },
  'push-right': {
    initial: { x: '-8%', opacity: 0, scale: 1.02 },
    animate: { x: 0, opacity: 1, scale: 1, transition: QUICK },
    exit:    { x: '6%', opacity: 0, scale: 0.99, transition: SNAP },
  },
  'zoom-in': {
    initial: { scale: 1.22, opacity: 0, filter: 'blur(12px)' },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
    exit:    { scale: 0.94, opacity: 0, filter: 'blur(6px)', transition: SNAP },
  },
  'zoom-out': {
    initial: { scale: 0.85, opacity: 0, filter: 'blur(10px)' },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
    exit:    { scale: 1.12, opacity: 0, filter: 'blur(8px)', transition: SNAP },
  },
  snap: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const } },
    exit:    { opacity: 0, scale: 1.02, transition: { duration: 0.15 } },
  },
}

export function SceneFrame({ children, className, transition = 'fade' }: Props) {
  return (
    <motion.div
      variants={VARIANTS[transition]}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'absolute inset-0 flex items-center justify-center px-6',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
