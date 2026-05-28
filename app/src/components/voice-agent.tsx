import { ConversationProvider, useConversation } from '@elevenlabs/react'
import { useCallback } from 'react'

// Dev: '' -> /api/token (proxied by Vite to the service).
// Prod: set VITE_SERVICE_URL to the deployed Elysia service origin.
const SERVICE_URL = import.meta.env.VITE_SERVICE_URL ?? ''

async function getToken() {
  const res = await fetch(`${SERVICE_URL}/api/token`)
  if (!res.ok) throw new Error('Failed to get conversation token')
  return (await res.json()).token as string
}

function VoiceControls() {
  const conversation = useConversation({
    onConnect: () => console.log('connected'),
    onDisconnect: () => console.log('disconnected'),
    onError: (message: string, context?: unknown) =>
      console.error('conversation error:', message, context),
  })

  const start = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      conversation.startSession({ conversationToken: await getToken() })
    } catch (error) {
      console.error('failed to start conversation:', error)
    }
  }, [conversation])

  const connected = conversation.status === 'connected'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <p style={{ opacity: 0.7, fontSize: 14 }}>Status: {conversation.status}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={start} disabled={connected}>
          Start conversation
        </button>
        <button onClick={() => conversation.endSession()} disabled={!connected}>
          End
        </button>
      </div>
    </div>
  )
}

export function VoiceAgent() {
  return (
    <ConversationProvider>
      <VoiceControls />
    </ConversationProvider>
  )
}
