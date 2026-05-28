import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase select-none',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-accent)] text-[var(--color-bg-0)]',
        buy: 'bg-[var(--color-accent)] text-[var(--color-bg-0)]',
        sell: 'bg-[var(--color-loss)] text-[#1F0A14]',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]',
        gain: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30',
        loss: 'bg-[var(--color-loss)]/15 text-[var(--color-loss)] border border-[var(--color-loss)]/30',
        muted:
          'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]/50',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
