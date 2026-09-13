export default function CyberpunkBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover cyberpunk-hud-video"
        src="/uplink-hud-background.webm"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 cyberpunk-hud-wash" />
      <div className="absolute inset-0 cyberpunk-scanlines" />
      <div className="absolute inset-0 cyberpunk-vignette" />
    </div>
  );
}
