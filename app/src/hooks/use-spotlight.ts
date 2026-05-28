// Fetches /api/spotlight on mount. Returns top market movers with sparklines
// so the empty state feels alive instead of empty.

import { useEffect, useState } from 'react'
import type { Spotlight } from '@/cards/types'

const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

export function useSpotlight(): {
  spotlight?: Spotlight
  loading: boolean
  error?: string
} {
  const [spotlight, setSpotlight] = useState<Spotlight | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    fetch(`${SERVICE_URL}/api/spotlight`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: Spotlight) => {
        if (!cancelled) {
          setSpotlight(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { spotlight, loading, error }
}
