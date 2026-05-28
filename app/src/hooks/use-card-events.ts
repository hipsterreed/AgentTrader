// Subscribe to the server's SSE card stream. Returns an append-only list of
// card events; CardFeed turns them into UI state.

import { useEffect, useState } from 'react'
import type { Card } from '../cards/types'

const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

export function useCardEvents(): Card[] {
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    const url = `${SERVICE_URL}/api/events`
    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const card = JSON.parse(e.data) as Card
        setCards((prev) => [...prev, card])
      } catch (err) {
        console.warn('[cards] bad event:', e.data, err)
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects; we just log. Treat heartbeat-driven
      // close as normal.
      console.debug('[cards] SSE blip — reconnecting')
    }

    return () => es.close()
  }, [])

  return cards
}
