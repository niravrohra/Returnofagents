"use client";

export function ThinkingText({ isLight = false }: { isLight?: boolean }) {
  const base = isLight ? "#6b7280" : "#9ca3af";
  const shine = isLight ? "#f9fafb" : "#f3f4f6";

  return (
    <span
      style={{
        fontSize: 14,
        background: `linear-gradient(90deg, ${base} 0%, ${base} 38%, ${shine} 50%, ${base} 62%, ${base} 100%)`,
        backgroundSize: "200% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        animation: "thinking-shimmer 1.8s ease-in-out infinite",
      }}
    >
      Thinking…
    </span>
  );
}
