"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { PDFViewer } from "@/components/pdf-viewer";

const PDF_VIEWER_KEY = "pdfViewerUrl";

export default function EditorPage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = sessionStorage.getItem(PDF_VIEWER_KEY);
    const name = sessionStorage.getItem("pdfViewerFileName") || "Document";
    if (url) {
      setPdfUrl(url);
      setFileName(name);
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleBack = () => {
    sessionStorage.removeItem(PDF_VIEWER_KEY);
    sessionStorage.removeItem("pdfViewerFileName");
    router.push("/");
  };


  const handleSend = () => {
    if (!inputValue.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: inputValue.trim() }]);
    setInputValue("");
    // Placeholder for AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm your AI assistant. Ask me anything about this document." },
      ]);
    }, 500);
  };

  const isLight = resolvedTheme === "light";
  const bg = isLight ? "#ffffff" : "#1a1a1a";
  const bgSecondary = isLight ? "#f5f5f5" : "#212121";
  const text = isLight ? "#1a1a1a" : "#ececec";
  const textMuted = isLight ? "#6b7280" : "#9ca3af";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  if (!pdfUrl) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          color: text,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: bg,
        fontFamily: "'Söhne', 'ui-sans-serif', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          background: isLight ? "#ffffff" : "#171717",
          borderBottom: `1px solid ${border}`,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
            color: text,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>
          {fileName}
        </span>
        <div style={{ width: 80 }} />
      </header>

      {/* Split: PDF left (larger) | Chat right */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left: PDF viewer - fills most of the space */}
        <div
          style={{
            flex: "0 0 58%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${border}`,
            background: isLight ? "#e8eaed" : "#252525",
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "16px 0",
            }}
          >
            <PDFViewer url={pdfUrl} isLight={isLight} />
          </div>
        </div>

        {/* Right: Chat UI */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            background: bg,
          }}
        >
          {/* Chat messages */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: "24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  color: textMuted,
                  fontSize: 16,
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 600, color: text }}>Ask about this document</div>
                <div style={{ textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>Select text in the PDF or type a question below to get started.</div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "14px 20px",
                    borderRadius: 14,
                    background: msg.role === "user" ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)") : "transparent",
                    border: msg.role === "assistant" ? `1px solid ${border}` : "none",
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: text,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div
            style={{
              flexShrink: 0,
              padding: "20px 32px 28px",
              borderTop: `1px solid ${border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 12,
                padding: "16px 18px",
                borderRadius: 14,
                background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${border}`,
              }}
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything about this document..."
                rows={2}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 15,
                  color: text,
                  fontFamily: "inherit",
                  resize: "none",
                  lineHeight: 1.5,
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: isLight ? "#1a1a1a" : "#ececec",
                  color: isLight ? "#ffffff" : "#1a1a1a",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
