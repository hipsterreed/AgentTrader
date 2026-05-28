import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, proxy /api to the Elysia service so the browser stays same-origin.
// In prod, set VITE_SERVICE_URL to the deployed service URL (see voice-agent.tsx).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
