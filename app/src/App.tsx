import { VoiceAgent } from './components/voice-agent'

function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ margin: 0 }}>Voice agent</h1>
        <p style={{ opacity: 0.7 }}>
          Speech Engine test bench. Start a conversation, allow your mic, and talk.
        </p>
      </div>
      <VoiceAgent />
    </main>
  )
}

export default App
