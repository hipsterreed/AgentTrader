import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-1)] cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)] text-[var(--color-bg-0)] hover:bg-[var(--color-accent)]/90 shadow-[0_0_20px_color-mix(in_oklab,var(--color-accent)_30%,transparent)] hover:shadow-[0_0_28px_color-mix(in_oklab,var(--color-accent)_55%,transparent)]',
        secondary:
          'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface)]/80 border border-[var(--color-border)]',
        ghost:
          'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.04]',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-white/[0.03] hover:border-[var(--color-accent)]/40',
        destructive:
          'bg-[var(--color-loss)]/15 text-[var(--color-loss)] border border-[var(--color-loss)]/40 hover:bg-[var(--color-loss)]/25',
        link: 'text-[var(--color-accent)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
