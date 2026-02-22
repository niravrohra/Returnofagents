"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addReaderItem } from "@/lib/reader-storage";

function LoadingPulse({ isLight }: { isLight: boolean }) {
  const color = isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            animation: "research-pulse 1.4s ease-in-out infinite both",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

function ResultSkeleton({ isLight }: { isLight: boolean }) {
  const bg = isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: bg,
        border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
      }}
    >
      <div
        style={{
          width: "70%",
          height: 16,
          borderRadius: 6,
          marginBottom: 10,
          background: isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)",
          animation: "research-shimmer 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "100%",
          height: 12,
          borderRadius: 4,
          marginBottom: 6,
          background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
          animation: "research-shimmer 1.5s ease-in-out infinite 0.15s",
        }}
      />
      <div
        style={{
          width: "85%",
          height: 12,
          borderRadius: 4,
          background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
          animation: "research-shimmer 1.5s ease-in-out infinite 0.3s",
        }}
      />
    </div>
  );
}

export type ResearchResult = {
  id: string;
  title: string;
  content: string;
  url?: string;
  source: "tavily" | "seda";
};

type ResearchResultsProps = {
  tavilyResults: ResearchResult[];
  sedaResults: ResearchResult[];
  query: string;
  isLight: boolean;
  isLoading?: boolean;
  onBack?: () => void;
  rawResponses?: { tavily?: unknown; seda?: unknown };
};

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

function ResultCard({
  result,
  isLight,
}: {
  result: ResearchResult;
  isLight: boolean;
}) {
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (added || extracting) return;

    // For Tavily with URL: use Tavily Extract to fetch page content for reader
    if (result.source === "tavily" && result.url) {
      setExtracting(true);
      setError(null);
      try {
        const res = await fetch("/api/tavily/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: result.url }),
        });
        const data = await res.json();
        const pageContent = data?.content;
        if (res.ok && typeof pageContent === "string" && pageContent.trim()) {
          addReaderItem({
            title: result.title,
            content: pageContent,
            url: result.url,
            source: result.source,
          });
        } else {
          addReaderItem({
            title: result.title,
            content: result.content || "[Could not fetch page content. Original snippet not available.]",
            url: result.url,
            source: result.source,
          });
        }
        setAdded(true);
      } catch {
        addReaderItem({
          title: result.title,
          content: result.content,
          url: result.url,
          source: result.source,
        });
        setAdded(true);
      } finally {
        setExtracting(false);
      }
    } else {
      addReaderItem({
        title: result.title,
        content: result.content,
        url: result.url,
        source: result.source,
      });
      setAdded(true);
    }
  };

  const bg = isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  const text = isLight ? "#1a1a1a" : "#ececec";
  const textMuted = isLight ? "#6b7280" : "#9ca3af";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: hovered ? (isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)") : bg,
        border: `1px solid ${border}`,
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: text,
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {result.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: textMuted,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {result.content}
          </div>
          {result.url && (
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                fontSize: 12,
                color: isLight ? "#6366f1" : "#818cf8",
                textDecoration: "none",
              }}
            >
              <ExternalIcon />
              {(() => {
                try {
                  return new URL(result.url!).hostname;
                } catch {
                  return result.url;
                }
              })()}
            </a>
          )}
        </div>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          {error && (
            <span style={{ fontSize: 10, color: "#ef4444" }}>{error}</span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={added || extracting}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: added ? (isLight ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)") : (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"),
              color: added ? "#22c55e" : text,
              cursor: added || extracting ? "default" : "pointer",
              transition: "background 0.15s",
            }}
            title={extracting ? "Fetching page…" : added ? "Added to Reader" : result.source === "tavily" && result.url ? "Add page content to Reader" : "Add to Reader"}
          >
            {added ? (
              <span style={{ fontSize: 14 }}>✓</span>
            ) : extracting ? (
              <span style={{ fontSize: 12 }}>…</span>
            ) : (
              <AddIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResearchResults({ tavilyResults, sedaResults, query, isLight, isLoading = false, onBack, rawResponses }: ResearchResultsProps) {
  const router = useRouter();
  const text = isLight ? "#1a1a1a" : "#ececec";
  const textMuted = isLight ? "#6b7280" : "#9ca3af";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  const handleOpenReader = () => {
    router.push("/reader");
  };

  const showEmptyError = !isLoading && tavilyResults.length === 0 && sedaResults.length === 0;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        padding: "0 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                color: text,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          )}
          <span style={{ fontSize: 16, fontWeight: 600, color: text }}>Results for &quot;{query}&quot;</span>
        </div>
        <button
          type="button"
          onClick={handleOpenReader}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            background: isLight ? "#1a1a1a" : "#6366f1",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Open Reader
        </button>
      </div>

      {/* Loading banner - shown only while fetching */}
      {isLoading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px",
            marginTop: 4,
            borderRadius: 10,
            background: isLight ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.1)",
            border: `1px solid ${isLight ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.25)"}`,
          }}
        >
          <LoadingPulse isLight={isLight} />
          <span style={{ fontSize: 14, color: isLight ? "#4f46e5" : "#818cf8", fontWeight: 500 }}>
            Searching Tavily & Seda…
          </span>
        </div>
      )}

      {/* Error when all empty (only after loading finishes) */}
      {showEmptyError && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isLight ? "rgba(239, 68, 68, 0.08)" : "rgba(239, 68, 68, 0.12)",
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            No results from any source. If you expected results, check that <strong>TAVILY_API_KEY</strong> and <strong>SEDA_AUTH_TOKEN</strong> are set correctly in <code>.env.local</code>.
          </div>
          {rawResponses && !!(rawResponses.tavily || rawResponses.seda) && (
            <details
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                fontSize: 12,
                color: textMuted,
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Debug: view raw API responses</summary>
              <pre style={{ marginTop: 8, overflow: "auto", maxHeight: 200 }}>{JSON.stringify(rawResponses, null, 2)}</pre>
            </details>
          )}
        </div>
      )}

      {/* Split: Tavily | Seda */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 20,
          minHeight: 0,
          padding: "20px 0",
          overflowX: "auto",
        }}
      >
        {/* Tavily column */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 220,
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${border}`,
            paddingRight: 20,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Tavily
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <ResultSkeleton key={i} isLight={isLight} />
                ))}
              </>
            ) : tavilyResults.length === 0 ? (
              <div style={{ color: textMuted, fontSize: 14 }}>No Tavily results</div>
            ) : (
              tavilyResults.map((r) => (
                <ResultCard key={r.id} result={r} isLight={isLight} />
              ))
            )}
          </div>
        </div>

        {/* Seda column */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 220,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Seda Research
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <ResultSkeleton key={i} isLight={isLight} />
                ))}
              </>
            ) : sedaResults.length === 0 ? (
              <div style={{ color: textMuted, fontSize: 14 }}>No Seda results</div>
            ) : (
              sedaResults.map((r) => (
                <ResultCard key={r.id} result={r} isLight={isLight} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
