// AgentTrader shell — two-column on desktop, single column on mobile.
// The voice orb floats above the scrolling feed (think ChatGPT input bar).

import { useCallback } from 'react'
import { useConversation } from '@elevenlabs/react'
import { VoiceOrb, type OrbState } from './voice-orb'
import { Topbar } from './layout/topbar'
import { PortfolioSidebar } from './layout/portfolio-sidebar'
import { AmbientGrid } from './ambient-grid'
import { CardFeed } from '@/cards/CardFeed'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCardEvents } from '@/hooks/use-card-events'
import { usePortfolio } from '@/hooks/use-portfolio'

const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

async function getToken() {
  const res = await fetch(`${SERVICE_URL}/api/token`)
  if (!res.ok) throw new Error('Failed to get conversation token')
  return (await res.json()).token as string
}

function deriveOrbState(status: string, isSpeaking: boolean): OrbState {
  if (status === 'connecting') return 'connecting'
  if (status === 'connected') return isSpeaking ? 'speaking' : 'listening'
  return 'idle'
}

export function AgentTraderShell() {
  const conversation = useConversation({
    onConnect: () => console.log('[voice] connected'),
    onDisconnect: () => console.log('[voice] disconnected'),
    onError: (message: string, context?: unknown) =>
      console.error('[voice] error:', message, context),
  })

  const cards = useCardEvents()
  const portfolio = usePortfolio(cards)

  const isSpeaking = Boolean(
    (conversation as unknown as { isSpeaking?: boolean }).isSpeaking,
  )
  const orbState = deriveOrbState(conversation.status, isSpeaking)
  const connected = conversation.status === 'connected'
  const connecting = conversation.status === 'connecting'

  const handleTap = useCallback(async () => {
    if (connecting) return
    if (connected) {
      conversation.endSession()
      return
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      conversation.startSession({ conversationToken: await getToken() })
    } catch (err) {
      console.error('[voice] failed to start:', err)
    }
  }, [conversation, connected, connecting])

  return (
    <div className="flex h-svh w-full flex-col">
      <Topbar
        marketOpen={portfolio.snapshot?.marketOpen}
        connected={connected}
        connecting={connecting}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <PortfolioSidebar
          snapshot={portfolio.snapshot}
          loading={portfolio.loading}
          error={portfolio.error}
          onDropOrder={portfolio.dropOpenOrder}
        />

        <main className="relative flex flex-1 min-w-0 flex-col">
          {/* Static dot texture so the main area never feels empty. */}
          <AmbientGrid />

          {/* ambient corner glow for hero depth (on top of the grid) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[600px] rounded-full bg-[var(--color-accent)]/[0.06] blur-3xl"
          />

          <ScrollArea className="flex-1 relative z-10">
            <div className="mx-auto w-full max-w-2xl">
              <CardFeed cards={cards} showPortfolioInFeed />
            </div>
          </ScrollArea>

          {/* Floating voice dock — just the orb, no capsule. A soft spotlight
              gradient behind it gives it presence without a hard edge.
              z-20 keeps it above the ScrollArea (which is z-10 to clear the
              ambient grid). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-10 md:pb-14">
            {/* spotlight glow under the orb */}
            <div
              aria-hidden
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[260px] pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 80% at 50% 100%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 70%)',
              }}
            />
            <div className="pointer-events-auto relative">
              <VoiceOrb
                state={orbState}
                onTap={handleTap}
                disabled={connecting}
                size="lg"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
