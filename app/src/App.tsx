import { useEffect, useState } from 'react'
import { ConversationProvider } from '@elevenlabs/react'
import { AgentTraderShell } from './components/voice-agent'
import { Presentation } from './presentation/Presentation'
import { Broll } from './presentation/Broll'
import { Toaster } from './components/ui/sonner'

type Route = 'app' | 'present' | 'broll'

const routeFromHash = (): Route => {
  if (typeof window === 'undefined') return 'app'
  const h = window.location.hash
  if (h.startsWith('#/present')) return 'present'
  if (h.startsWith('#/broll')) return 'broll'
  return 'app'
}

function App() {
  // Hash-based route switch — no router dep just to mount sibling marketing
  // pages. /#/present is the self-running trailer. /#/broll is the manual
  // B-roll page for the founder-pitch video. Bare / mounts the live agent.
  const [route, setRoute] = useState<Route>(routeFromHash)
  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <ConversationProvider>
      {route === 'present' ? <Presentation /> :
       route === 'broll'   ? <Broll />        :
       <AgentTraderShell />}
      <Toaster />
    </ConversationProvider>
  )
}

export default App
