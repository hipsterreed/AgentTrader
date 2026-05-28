import { useEffect, useState } from 'react'
import { ConversationProvider } from '@elevenlabs/react'
import { AgentTraderShell } from './components/voice-agent'
import { Presentation } from './presentation/Presentation'
import { Broll } from './presentation/Broll'
import { Landing } from './presentation/Landing'
import { Toaster } from './components/ui/sonner'

type Route = 'landing' | 'agent' | 'present' | 'broll'

const routeFromHash = (): Route => {
  if (typeof window === 'undefined') return 'landing'
  const h = window.location.hash
  if (h.startsWith('#/present')) return 'present'
  if (h.startsWith('#/broll')) return 'broll'
  if (h.startsWith('#/agent')) return 'agent'
  return 'landing'
}

function App() {
  // Hash-based route switch — no router dep. Public site:
  //   /         → Landing (brand reveal cover with CTA)
  //   #/agent   → AgentTraderShell (live voice agent)
  // Marketing-only:
  //   #/present → 35s self-running trailer
  //   #/broll   → manual B-roll page for the founder-pitch video
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
       route === 'agent'   ? <AgentTraderShell /> :
       <Landing />}
      <Toaster />
    </ConversationProvider>
  )
}

export default App
