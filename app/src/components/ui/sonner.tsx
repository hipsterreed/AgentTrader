import { Toaster as SonnerToaster, type ToasterProps } from 'sonner'

/** Themed sonner toaster — matches our navy + teal palette.
 *  Mount once near the root. Use `import { toast } from 'sonner'` to fire. */
function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      richColors={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'glass !bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] !text-[var(--color-text)] !border-[var(--color-border)] glow-accent-soft !rounded-xl',
          title: 'text-[var(--color-text)] font-medium',
          description: 'text-[var(--color-text-muted)]',
          success: '!text-[var(--color-accent)]',
          error: '!text-[var(--color-loss)]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
