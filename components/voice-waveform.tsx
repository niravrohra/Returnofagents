"use client";

export function VoiceWaveform({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  const bars = 5;
  const barWidth = Math.max(2, size / 8);
  const gap = Math.max(1, size / 12);
  const barHeight = size * 0.6;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: gap,
        height: size,
        width: size,
      }}
      aria-label="Listening"
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: barHeight,
            borderRadius: barWidth / 2,
            background: color,
            transformOrigin: "center",
            animation: "voice-wave 0.8s ease-in-out infinite",
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
