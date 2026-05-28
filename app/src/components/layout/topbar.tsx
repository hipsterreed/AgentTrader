import { Settings, Activity, MoonStar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  marketOpen?: boolean
  connected: boolean
  connecting?: boolean
}

export function Topbar({ marketOpen, connected, connecting }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)]/40 px-4 md:px-6 backdrop-blur-md bg-[var(--color-bg-1)]/40">
      <div className="flex items-center gap-3 md:gap-5">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                connected
                  ? 'bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]'
                  : connecting
                    ? 'bg-[var(--color-warn)]'
                    : 'bg-[var(--color-text-dim)]',
              )}
            />
            {connected && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-accent)] opacity-50" />
            )}
          </span>
          <span className="font-semibold tracking-tight text-[var(--color-text)]">
            AgentTrader
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Activity className="size-3.5" />
          <span className="tracking-wide">
            {marketOpen ? 'NYSE OPEN' : 'NYSE CLOSED'}
          </span>
          <Badge variant={marketOpen ? 'gain' : 'muted'} className="hidden lg:inline-flex">
            Paper
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Theme">
          <MoonStar className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="size-4" />
        </Button>
      </div>
    </header>
  )
}
