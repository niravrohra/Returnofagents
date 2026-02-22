"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { marked } from "marked";
import { getReaderItems, removeReaderItem, updateReaderItem, getChatHistory, setChatHistory, getChatCollapsed, setChatCollapsed, type ReaderItem, type ChatMessage } from "@/lib/reader-storage";
import { useSpeechRecognition, speakText, stopSpeaking } from "@/lib/voice";
import { VoiceWaveform } from "@/components/voice-waveform";
import { ThinkingText } from "@/components/thinking-text";

const WIKI_NAV_PATTERNS = [
  /^Jump to content\s*\n?/im,
  /^Search\s*\n?/im,
  /^Contents\s*\(Top\)\s*\n?/im,
  /(?:^\d+(?:\.\d+)?\s+[\w\s]+\s*\n?)+/gm,
  /^Edit links\s*\n?/im,
  /^Article\s*\n?/im,
  /^Talk\s*\n?/im,
  /^Read\s*\n?/im,
  /^Edit\s*\n?/im,
  /^View history\s*\n?/im,
  /^Tools\s*\n?/im,
  /^Actions\s*\n?/im,
  /^General\s*\n?/im,
  /^What links here\s*\n?/im,
  /^Related changes\s*\n?/im,
  /^Upload file\s*\n?/im,
  /^Permanent link\s*\n?/im,
  /^Page information\s*\n?/im,
  /^Cite this page\s*\n?/im,
  /^Get shortened URL\s*\n?/im,
  /^Download QR code\s*\n?/im,
  /^Print\/export\s*\n?/im,
  /^Download as PDF\s*\n?/im,
  /^Printable version\s*\n?/im,
  /^In other projects\s*\n?/im,
  /^Wikidata item\s*\n?/im,
  /^Appearance\s*\n?/im,
  /^From Wikipedia, the free encyclopedia\s*\n?/im,
];

const WIKI_EMPTY_LABELS = /^(Directed by|Written by|Story by|Produced by|Starring|Cinematography|Edited by|Music by|Production company|Distributed by|Release date|Running time|Country|Language|Budget)\s*$/gm;

function cleanExtractedContent(content: string): string {
  let out = content
    .replace(/!\[[^\]]*\]\s*\(\s*(?:["'][^"']*["'])?\s*\)/g, "");

  for (const re of WIKI_NAV_PATTERNS) {
    out = out.replace(re, "");
  }

  out = out.replace(WIKI_EMPTY_LABELS, "");

  out = out.replace(/\s*\[edit\]\s*/gi, " ");
  out = out.replace(/^[^\x00-\x7F\s]{2,}\s*$/gm, "");

  out = out.replace(/\n{4,}/g, "\n\n\n");
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

export default function ReaderPage() {
  const [items, setItems] = useState<ReaderItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionText, setSelectionText] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sophistication, setSophistication] = useState(50);
  const [isEditing, setIsEditing] = useState(false);
  const [explainPanelCollapsed, setExplainPanelCollapsed] = useState(true);
  const [cartoonByIndex, setCartoonByIndex] = useState<Record<number, string>>({});
  const [cartoonLoadingForIndex, setCartoonLoadingForIndex] = useState<number | null>(null);
  const [cartoonErrorByIndex, setCartoonErrorByIndex] = useState<Record<number, string>>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentEditRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { start: startVoice, stop: stopVoice, isListening: voiceListening, error: voiceError } = useSpeechRecognition();
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadedItems = getReaderItems();
    setItems(loadedItems);
    if (loadedItems.length > 0) setSelectedId(loadedItems[0].id);
  }, []);

  useEffect(() => {
    if (!selectedId || typeof window === "undefined") return;
    try {
      const sel = window.getSelection?.();
      if (sel && typeof sel.removeAllRanges === "function") sel.removeAllRanges();
    } catch { /* Safari / edge cases */ }
    setSelectionText(null);
    setChatMessages(getChatHistory(selectedId));
    setExplainPanelCollapsed(getChatCollapsed(selectedId));
    setCartoonByIndex({});
    setCartoonErrorByIndex({});
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || typeof window === "undefined") return;
    setChatHistory(selectedId, chatMessages);
  }, [selectedId, chatMessages]);

  useEffect(() => {
    if (!selectedId || typeof window === "undefined") return;
    setChatCollapsed(selectedId, explainPanelCollapsed);
  }, [selectedId, explainPanelCollapsed]);

  const handleRemove = (id: string) => {
    removeReaderItem(id);
    setItems(getReaderItems());
    if (selectedId === id) setSelectedId(null);
  };

  function getContextAroundSelection(fullContent: string, selected: string, charsAround = 600): string {
    let idx = fullContent.indexOf(selected);
    if (idx === -1) {
      const sub = selected.slice(0, Math.min(50, selected.length));
      idx = fullContent.indexOf(sub);
    }
    if (idx === -1) return fullContent.slice(0, 2000);
    return fullContent.slice(Math.max(0, idx - charsAround), Math.min(fullContent.length, idx + selected.length + charsAround));
  }

  const handleSelection = useCallback(() => {
    stopSpeaking();
    setSpeakingIndex(null);
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    const text = sel?.toString()?.trim();
    if (!text || text.length === 0) return;
    if (contentRef.current && !contentRef.current.contains(sel?.anchorNode || null)) return;
    setSelectionText(text);
    setChatMessages([]);
    setCartoonByIndex({});
    setCartoonErrorByIndex({});
  }, []);

  const clearSelection = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const s = window.getSelection?.();
        if (s && typeof s.removeAllRanges === "function") s.removeAllRanges();
      } catch { /* ignore */ }
    }
    setSelectionText(null);
    setChatMessages([]);
    setChatInput("");
    setCartoonByIndex({});
    setCartoonErrorByIndex({});
  }, []);

  const closeExplainPanel = useCallback(() => {
    stopSpeaking();
    setSpeakingIndex(null);
    setExplainPanelCollapsed(true);
    if (typeof window !== "undefined") {
      try {
        const s = window.getSelection?.();
        if (s && typeof s.removeAllRanges === "function") s.removeAllRanges();
      } catch { /* ignore */ }
    }
    setSelectionText(null);
  }, []);

  const sendToMiniMax = useCallback(
    async (userContent: string, isFollowUp: boolean) => {
      const item = items.find((i) => i.id === selectedId);
      if (!item || (item.source !== "tavily" && item.source !== "seda" && item.source !== "pdf")) return;

      const hasSelection = !isFollowUp && selectionText;
      const contextAround = hasSelection
        ? getContextAroundSelection(item.content, selectionText)
        : undefined;

      let documentContent: string | undefined;
      if (!hasSelection) {
        const rawContent = item.source === "pdf" ? item.content : cleanExtractedContent(item.content);
        const maxDocChars = 14000;
        documentContent = rawContent.length > maxDocChars
          ? rawContent.slice(0, maxDocChars) + "\n\n[... document truncated ...]"
          : rawContent;
      }

      const context = {
        pageTitle: item.title,
        documentContent,
        contextAroundSelection: contextAround,
        selectedText: isFollowUp ? undefined : selectionText || undefined,
        sophistication,
      };

      const messages: Array<{ role: string; content: string }> = isFollowUp
        ? [...chatMessages, { role: "user" as const, content: userContent }]
        : [{ role: "user" as const, content: "Explain the selected text in context." }];

      setChatLoading(true);
      if (isFollowUp) setChatMessages((prev) => [...prev, { role: "user", content: userContent }]);

      try {
        const res = await fetch("/api/minimax/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, context }),
        });
        const data = await res.json();

        if (res.ok && data.content) {
          setChatMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        } else {
          setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
        }
      } catch {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
      } finally {
        setChatLoading(false);
        setChatInput("");
      }
    },
    [items, selectedId, selectionText, chatMessages, sophistication]
  );

  const handleVoiceInput = useCallback(() => {
    if (voiceListening) {
      stopVoice();
      return;
    }
    startVoice((text) => {
      setChatInput((prev) => (prev ? `${prev} ${text}` : text));
    });
  }, [voiceListening, startVoice, stopVoice]);

  const generateCartoonForIndex = useCallback(async (index: number) => {
    const msg = chatMessages[index];
    if (msg?.role !== "assistant" || !msg.content) return;
    setCartoonLoadingForIndex(index);
    setCartoonErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    try {
      const res = await fetch("/api/gemini/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ explanation: msg.content, selectionText }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCartoonByIndex((prev) => ({ ...prev, [index]: data.url }));
      } else {
        setCartoonErrorByIndex((prev) => ({ ...prev, [index]: data.error || "Failed to generate cartoon" }));
      }
    } catch {
      setCartoonErrorByIndex((prev) => ({ ...prev, [index]: "Failed to generate cartoon" }));
    } finally {
      setCartoonLoadingForIndex(null);
    }
  }, [chatMessages, selectionText]);

  const selectedItem = items.find((i) => i.id === selectedId);
  const canEdit = !!selectedItem;

  const startEditing = useCallback(() => {
    clearSelection();
    setIsEditing(true);
  }, [clearSelection]);

  useLayoutEffect(() => {
    if (!isEditing || !selectedItem || !contentEditRef.current) return;
    const html =
      selectedItem.content.trimStart().startsWith("<") && selectedItem.content.includes("</")
        ? selectedItem.content
        : marked(selectedItem.source === "pdf" ? selectedItem.content : cleanExtractedContent(selectedItem.content)) as string;
    contentEditRef.current.innerHTML = html;
  }, [isEditing, selectedItem?.id, selectedItem?.content]);

  const savingRef = useRef(false);
  const saveEditing = useCallback(() => {
    if (!selectedId || !selectedItem || savingRef.current) return;
    savingRef.current = true;
    const newTitle = titleRef.current?.innerText?.trim() || selectedItem.title;
    const raw = contentEditRef.current?.innerHTML ?? selectedItem.content;
    const newContent = raw.trim();
    updateReaderItem(selectedId, { title: newTitle, content: newContent });
    setItems(getReaderItems());
    setIsEditing(false);
    savingRef.current = false;
  }, [selectedId, selectedItem]);

  const canExplain =
    selectionText &&
    selectedItem &&
    (selectedItem.source === "tavily" || selectedItem.source === "seda" || selectedItem.source === "pdf");

  useEffect(() => {
    if (!canExplain || chatMessages.length > 0 || chatLoading) return;
    sendToMiniMax("Explain the selected text in context.", false);
  }, [canExplain, chatMessages.length, chatLoading, sendToMiniMax]);
  const isLight = resolvedTheme === "light";
  const bg = isLight ? "#ffffff" : "#1a1a1a";
  const text = isLight ? "#1a1a1a" : "#ececec";
  const textMuted = isLight ? "#6b7280" : "#9ca3af";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const hasContent = items.length > 0;

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
          onClick={() => router.push("/")}
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
        <span style={{ fontSize: 15, fontWeight: 600, color: text }}>Reader</span>
        <div style={{ width: 80 }} />
      </header>

      {/* Split: List left | Content right */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Left: Reading list */}
        <div
          style={{
            width: 280,
            minWidth: 280,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: `1px solid ${border}`,
            background: isLight ? "#f9fafb" : "#1f1f1f",
          }}
        >
          <div style={{ padding: "16px 12px", borderBottom: `1px solid ${border}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Saved items
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  cursor: "pointer",
                  background: selectedId === item.id ? (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)") : "transparent",
                  color: text,
                }}
              >
                <div
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{item.source}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  style={{
                    padding: 4,
                    borderRadius: 6,
                    border: "none",
                    background: "transparent",
                    color: textMuted,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
            {!hasContent && (
              <div style={{ padding: 24, color: textMuted, fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>
                No saved items yet. Search on the home page and click <strong>Add</strong> to save articles here.
              </div>
            )}
          </div>
        </div>

        {/* Center: Content + Right: Explain panel */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
          {selectedItem && (
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "40px 48px 60px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <article
                style={{
                  maxWidth: 720,
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
                  <h1
                    ref={titleRef}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    style={{
                      flex: 1,
                      fontSize: 28,
                      fontWeight: 700,
                      color: text,
                      marginBottom: 0,
                      lineHeight: 1.25,
                      letterSpacing: "-0.02em",
                      outline: isEditing ? "none" : "none",
                    }}
                  >
                    {selectedItem.title}
                  </h1>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        (isEditing ? saveEditing : startEditing)();
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: isEditing ? "#22c55e" : "transparent",
                        color: isEditing ? "#fff" : text,
                        borderWidth: isEditing ? 0 : 1,
                        borderStyle: "solid",
                        borderColor: border,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isEditing ? "Save" : "Edit"}
                    </button>
                  )}
                </div>
                {selectedItem.url && (
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 14, color: text, textDecoration: "underline", marginBottom: 28, display: "inline-block" }}
                  >
                    Open original →
                  </a>
                )}
                {isEditing ? (
                  <div
                    key={`edit-${selectedId}`}
                    ref={contentEditRef}
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      fontSize: 17,
                      lineHeight: 1.75,
                      color: text,
                      outline: "none",
                    }}
                    className="reader-editable"
                  />
                ) : (
                  <div
                    ref={contentRef}
                    onMouseUp={handleSelection}
                    style={{
                      fontSize: 17,
                      lineHeight: 1.75,
                      color: text,
                    }}
                  >
                    {selectedItem.content.trimStart().startsWith("<") && selectedItem.content.includes("</") ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
                    ) : (selectedItem.source === "seda" || selectedItem.source === "tavily" || selectedItem.source === "pdf") ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({ src, alt }) => {
                            if (!src || (typeof src === "string" && src.trim() === "")) return null;
                            return <img src={src} alt={alt || ""} loading="lazy" style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }} />;
                          },
                          h2: ({ children }) => <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 32, marginBottom: 12, color: text }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: 17, fontWeight: 600, marginTop: 24, marginBottom: 8, color: text }}>{children}</h3>,
                          p: ({ children }) => <p style={{ marginBottom: 16 }}>{children}</p>,
                        }}
                      >
                        {selectedItem.source === "pdf" ? selectedItem.content : cleanExtractedContent(selectedItem.content)}
                      </ReactMarkdown>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{selectedItem.content}</div>
                    )}
                  </div>
                )}
              </article>
            </div>
          )}
          {!selectedId && hasContent && (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textMuted,
                fontSize: 16,
              }}
            >
              Select an item to read
            </div>
          )}
          </div>
          {selectedItem && (selectedItem.source === "seda" || selectedItem.source === "tavily" || selectedItem.source === "pdf") && (
            explainPanelCollapsed ? (
              <div
                style={{
                  width: 40,
                  minWidth: 40,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: `1px solid ${border}`,
                  background: isLight ? "#fafafa" : "#1f1f1f",
                  cursor: "pointer",
                }}
                onClick={() => setExplainPanelCollapsed(false)}
                title="Expand explanation"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "rotate(-90deg)", color: textMuted }}>
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </div>
            ) : (
            <div
              style={{
                width: 360,
                minWidth: 360,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                borderLeft: `1px solid ${border}`,
                background: isLight ? "#fafafa" : "#1f1f1f",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${border}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Explain</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setExplainPanelCollapsed(true)}
                    style={{ padding: 4, borderRadius: 6, border: "none", background: "transparent", color: textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                    title="Collapse"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: "rotate(90deg)" }}>
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={closeExplainPanel}
                    style={{ padding: 4, borderRadius: 6, border: "none", background: "transparent", color: textMuted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>Explanation level</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: textMuted }}>Simple</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sophistication}
                    onChange={(e) => setSophistication(Number(e.target.value))}
                    style={{ flex: 1, accentColor: isLight ? "#1a1a1a" : "#ececec" }}
                  />
                  <span style={{ fontSize: 11, color: textMuted }}>Detailed</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 16, minHeight: 120 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: m.role === "user" ? (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)") : (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)"),
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: text,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {m.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : m.content}
                        </div>
                        {m.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (speakingIndex === i) {
                                stopSpeaking();
                                setSpeakingIndex(null);
                              } else {
                                speakText(m.content, {
                                  onStart: () => setSpeakingIndex(i),
                                  onEnd: () => setSpeakingIndex(null),
                                });
                              }
                            }}
                            style={{
                              flexShrink: 0,
                              padding: 6,
                              borderRadius: 6,
                              border: "none",
                              background: speakingIndex === i ? (isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)") : "transparent",
                              color: speakingIndex === i ? text : textMuted,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={speakingIndex === i ? "Stop" : "Read aloud"}
                          >
                            {speakingIndex === i ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {m.role === "assistant" && (
                      <div style={{ marginTop: 10, marginLeft: 0 }}>
                        {cartoonByIndex[i] ? (
                          <a
                            href={cartoonByIndex[i]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "block", borderRadius: 10, overflow: "hidden", border: `1px solid ${border}` }}
                          >
                            <img src={cartoonByIndex[i]} alt="Cartoon explanation" style={{ width: "100%", height: "auto", display: "block" }} />
                          </a>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => generateCartoonForIndex(i)}
                              disabled={cartoonLoadingForIndex !== null}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 14px",
                                borderRadius: 8,
                                border: `1px solid ${border}`,
                                background: cartoonLoadingForIndex === i ? (isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)") : "transparent",
                                color: cartoonLoadingForIndex === i ? textMuted : text,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: cartoonLoadingForIndex !== null ? "default" : "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              {cartoonLoadingForIndex === i ? "Generating…" : <>Explain as cartoon</>}
                            </button>
                            {cartoonErrorByIndex[i] && (
                              <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{cartoonErrorByIndex[i]}</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && <ThinkingText isLight={isLight} />}
              </div>
              {voiceError && (
                <div style={{ padding: "0 16px 8px", fontSize: 12, color: "#dc2626" }}>
                  {voiceError === "not-allowed" ? "Microphone blocked. Allow mic in browser settings." : voiceError}
                </div>
              )}
              <div style={{ padding: 12, borderTop: `1px solid ${border}`, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) {
                      e.preventDefault();
                      const msg = chatInput.trim();
                      setChatInput("");
                      sendToMiniMax(msg, true);
                    }
                  }}
                  placeholder="Ask a follow-up..."
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${border}`,
                    background: isLight ? "#fff" : "#2a2a2a",
                    color: text,
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  disabled={chatLoading}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    background: voiceListening ? (isLight ? "rgba(220,38,38,0.1)" : "rgba(248,113,113,0.15)") : "transparent",
                    color: voiceListening ? "#dc2626" : textMuted,
                    cursor: chatLoading ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={voiceListening ? "Click to stop and add your speech" : "Click to speak, then click again when done"}
                >
                  {voiceListening ? (
                    <VoiceWaveform size={18} color={isLight ? "#dc2626" : "#f87171"} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = chatInput.trim();
                    if (msg) {
                      setChatInput("");
                      sendToMiniMax(msg, true);
                    }
                  }}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: (chatInput.trim() && !chatLoading) ? (isLight ? "#1a1a1a" : "#ececec") : (isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"),
                    color: (chatInput.trim() && !chatLoading) ? (isLight ? "#fff" : "#1a1a1a") : textMuted,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: (chatInput.trim() && !chatLoading) ? "pointer" : "default",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
