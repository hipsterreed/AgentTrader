// Static background dot pattern — pure CSS tiling radial gradient.
// Lightweight (zero DOM elements beyond the wrapper), no animation, just
// subtle texture so the main area never feels empty.

export function AmbientGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(94, 234, 212, 0.10) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        // Soft vignette so the dots fade near the edges, keeping the topbar
        // / sidebar borders clean and drawing the eye to the conversation area.
        maskImage:
          'radial-gradient(ellipse 90% 80% at 50% 60%, black 30%, transparent 95%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 90% 80% at 50% 60%, black 30%, transparent 95%)',
      }}
    />
  )
}
