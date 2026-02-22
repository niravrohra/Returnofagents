"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { addReaderItem } from "@/lib/reader-storage";
import { useSpeechRecognition } from "@/lib/voice";
import { VoiceWaveform } from "@/components/voice-waveform";
import type { ResearchResult } from "@/components/research-results";

const ResearchResults = dynamic(
  () => import("@/components/research-results").then((m) => ({ default: m.ResearchResults })),
  { ssr: false }
);


const NeelIcon = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <span style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    {children}
  </span>
);

// SVG Icons
const NewChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SidebarToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#212121",
    color: "#ececec",
    fontFamily: "'Söhne', 'ui-sans-serif', system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: 260,
    minWidth: 260,
    background: "#171717",
    display: "flex",
    flexDirection: "column",
    padding: "8px 0",
    height: "100vh",
    overflow: "hidden",
  },
  sidebarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 12px 4px 14px",
    marginBottom: 4,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#ececec",
    cursor: "pointer",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#b4b4b4",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    margin: "1px 6px",
    fontSize: 14,
    color: "#ececec",
    fontWeight: 400,
    transition: "background 0.15s",
  },
  sectionLabel: {
    fontSize: 12,
    color: "#8e8ea0",
    fontWeight: 500,
    padding: "10px 16px 4px",
    letterSpacing: "0.02em",
    textTransform: "none",
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    padding: "7px 14px",
    margin: "1px 6px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    color: "#b4b4b4",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "background 0.15s",
    fontWeight: 400,
  },
  userArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 14px",
    margin: "4px 6px",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: "auto",
    transition: "background 0.15s",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#ececec",
    lineHeight: 1.3,
  },
  userPlan: {
    fontSize: 12,
    color: "#8e8ea0",
    lineHeight: 1.3,
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    background: "#212121",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    height: 56,
    flexShrink: 0,
  },
  modelSelector: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    padding: "6px 10px",
    borderRadius: 8,
    border: "none",
    background: "none",
    color: "#ececec",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  centerContent: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  readyText: {
    fontSize: 32,
    fontWeight: 600,
    color: "#ececec",
    letterSpacing: "-0.02em",
  },
  inputArea: {
    padding: "0 16px 24px",
    flexShrink: 0,
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
  },
  inputBox: {
    display: "flex",
    alignItems: "center",
    background: "#2f2f2f",
    borderRadius: 16,
    padding: "12px 14px",
    gap: 10,
    border: "none",
    outline: "none",
  },
  inputBtn: {
    background: "none",
    border: "none",
    color: "#8e8ea0",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: 6,
    transition: "color 0.15s",
  },
  inputField: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: "#ececec",
    fontFamily: "inherit",
    caretColor: "#ececec",
  },
};

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  itemStyle?: React.CSSProperties;
  onClick?: () => void;
};
const NavItem = ({ icon, label, itemStyle, onClick }: NavItemProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role={onClick ? "button" : undefined}
      style={{
        ...styles.navItem,
        ...itemStyle,
        background: hovered ? "rgba(128,128,128,0.2)" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <NeelIcon>{icon}</NeelIcon>
      <span>{label}</span>
    </div>
  );
};

type ChatPreviewProps = {
  title: string;
  isActive: boolean;
  itemStyle?: React.CSSProperties;
  activeColor?: string;
  onClick: () => void;
};
const ChatPreview = ({ title, isActive, itemStyle, activeColor, onClick }: ChatPreviewProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="button"
      style={{
        ...styles.chatItem,
        ...itemStyle,
        background: isActive || hovered ? "rgba(128,128,128,0.2)" : "transparent",
        color: isActive ? (activeColor ?? "#ececec") : "#8e8ea0",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {title}
    </div>
  );
};

function normalizeTavilyResults(data: unknown): ResearchResult[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const results = (obj.results ?? obj.result ?? []) as Array<Record<string, unknown>>;
  if (!Array.isArray(results)) return [];
  return results.map((r, i) => ({
    id: `tavily-${i}-${Date.now()}`,
    title: String(r.title ?? r.name ?? "Untitled"),
    content: String(r.content ?? r.snippet ?? ""),
    url: typeof r.url === "string" ? r.url : undefined,
    source: "tavily" as const,
  }));
}

type SedaSearchResult = {
  _id: string;
  query?: { original?: string; refined?: string; contextual?: string | null };
  markdown?: { summary?: string; engaging?: string };
  result?: {
    data?: {
      title?: string;
      answer?: string;
      discoveries?: { discovery: string; hook?: string; emoji?: string; index?: number }[];
      nextQuestions?: string[];
    };
    citations?: { url: string; description?: string }[];
  };
  chains?: { chainId: string; chainName?: string }[];
};

type SedaSearchResponse = {
  success?: boolean;
  results?: SedaSearchResult[];
};

function formatSedaContentForReader(r: SedaSearchResult): string {
  const parts: string[] = [];
  const answer = r.result?.data?.answer;
  const summary = r.markdown?.summary;
  const discoveries = r.result?.data?.discoveries;
  const nextQuestions = r.result?.data?.nextQuestions;
  const citations = r.result?.citations;

  if (answer) parts.push(answer);
  if (summary && summary !== answer) parts.push(summary);
  if (discoveries?.length) {
    parts.push("\n\nDiscoveries:\n" + discoveries.map((d) => `${d.emoji ?? "•"} ${d.discovery}${d.hook ? ` – ${d.hook}` : ""}`).join("\n"));
  }
  if (nextQuestions?.length) {
    parts.push("\n\nFollow-up questions:\n" + nextQuestions.map((q) => `• ${q}`).join("\n"));
  }
  if (citations?.length) {
    parts.push("\n\nCitations:\n" + citations.map((c) => (c.description?.trim() ? c.description : c.url)).join("\n"));
  }
  return parts.join("\n\n").trim() || "No content available.";
}

function normalizeSedaResults(data: unknown): ResearchResult[] {
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  const items = (obj.results ?? obj.data ?? obj.items ?? []) as SedaSearchResult[];
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map((r, i) => {
    const title = r.result?.data?.title || r.query?.original || r.query?.refined || `Result ${i + 1}`;
    const fullContent = formatSedaContentForReader(r);
    const firstCitation = r.result?.citations?.[0]?.url;

    return {
      id: r._id || `seda-${i}-${Date.now()}`,
      title,
      content: fullContent,
      url: firstCitation,
      source: "seda" as const,
    };
  });
}

export default function Neel() {
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState<{ id: string; title: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileBlobUrls, setFileBlobUrls] = useState<string[]>([]);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchQuery, setResearchQuery] = useState<string | null>(null);
  const [tavilyResults, setTavilyResults] = useState<ResearchResult[]>([]);
  const [sedaResults, setSedaResults] = useState<ResearchResult[]>([]);
  const [lastRawResponses, setLastRawResponses] = useState<{ tavily?: unknown; seda?: unknown }>({});
  const [pdfExtracting, setPdfExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { start: startVoice, stop: stopVoice, isListening: voiceListening, error: voiceError } = useSpeechRecognition();

  const handleVoiceInput = useCallback(() => {
    if (voiceListening) {
      stopVoice();
      return;
    }
    startVoice((text) => {
      setInputValue(text);
      inputRef.current?.focus();
    });
  }, [voiceListening, startVoice, stopVoice]);
  const { resolvedTheme } = useTheme();

  const handleResearchSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setResearchLoading(true);
    setResearchQuery(q);
    setTavilyResults([]);
    setSedaResults([]);

    let tavilyJson: unknown = null;
    let sedaJson: unknown = null;

    const processTavily = fetch("/api/tavily/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, max_results: 10 }),
    })
      .then(async (res) => {
        const data = res.ok ? await res.json() : null;
        tavilyJson = data;
        setTavilyResults(data ? normalizeTavilyResults(data) : []);
      })
      .catch((err) => {
        console.error("Tavily search error:", err);
      });

    const processSeda = fetch(`/api/seda/search?q=${encodeURIComponent(q)}&limit=10`)
      .then(async (res) => {
        const data = res.ok ? await res.json() : null;
        sedaJson = data;
        setSedaResults(data ? normalizeSedaResults(data) : []);
      })
      .catch((err) => {
        console.error("Seda search error:", err);
      });

    try {
      await Promise.allSettled([processTavily, processSeda]);
      setLastRawResponses({ tavily: tavilyJson, seda: sedaJson });
    } catch (err) {
      console.error("Research search error:", err);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleNewChat = () => {
    const id = `chat-${Date.now()}`;
    setChats((prev) => [{ id, title: `New chat ${prev.length + 1}` }, ...prev]);
    setActiveChatId(id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const pdfIndex = fileArray.findIndex((f) => f.type === "application/pdf");
    if (pdfIndex !== -1) {
      const pdfFile = fileArray[pdfIndex];
      setPdfExtracting(true);
      try {
        const formData = new FormData();
        formData.append("file", pdfFile);
        const res = await fetch("/api/nutrient/extract", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.title && data.content) {
          addReaderItem({
            title: data.title,
            content: data.content,
            source: "pdf",
          });
          router.push("/reader");
        } else {
          console.error("PDF extraction failed:", data?.error || data);
        }
      } finally {
        setPdfExtracting(false);
      }
    } else {
      const urls = fileArray.map((f) => URL.createObjectURL(f));
      setUploadedFiles((prev) => [...prev, ...fileArray]);
      setFileBlobUrls((prev) => [...prev, ...urls]);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileBlobUrls((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index]);
      return next.filter((_, i) => i !== index);
    });
  };

  const blobUrlsRef = useRef<string[]>([]);
  blobUrlsRef.current = fileBlobUrls;
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const isLight = resolvedTheme === "light";
  const themeStyles = {
    root: {
      ...styles.root,
      background: isLight ? "#ffffff" : "#212121",
      color: isLight ? "#1a1a1a" : "#ececec",
    },
    sidebar: {
      ...styles.sidebar,
      background: isLight ? "#ffffff" : "#171717",
    },
    main: {
      ...styles.main,
      background: isLight ? "#ffffff" : "#212121",
    },
    readyText: {
      ...styles.readyText,
      color: isLight ? "#1a1a1a" : "#ececec",
    },
    inputBox: {
      ...styles.inputBox,
      background: isLight ? "#ffffff" : "#2f2f2f",
      boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
    },
    inputField: {
      ...styles.inputField,
      color: isLight ? "#1a1a1a" : "#ececec",
      caretColor: isLight ? "#1a1a1a" : "#ececec",
    },
    modelSelector: {
      ...styles.modelSelector,
      color: isLight ? "#1a1a1a" : "#ececec",
    },
    navItem: {
      ...styles.navItem,
      color: isLight ? "#1a1a1a" : "#ececec",
    },
    chatItem: {
      ...styles.chatItem,
      color: isLight ? "#1a1a1a" : "#b4b4b4",
    },
    logoWrapper: {
      padding: 6,
      borderRadius: 10,
      background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.1)" : "0 0 12px rgba(255,255,255,0.1)",
    },
  };

  return (
    <div style={themeStyles.root}>
      {/* Sidebar */}
      <div
        style={{
          ...themeStyles.sidebar,
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          flexShrink: 0,
          padding: sidebarOpen ? "8px 0" : 0,
          overflow: "hidden",
          transition: "width 0.2s ease, min-width 0.2s ease",
        }}
      >
        {sidebarOpen && (
          <>
            {/* Toggle */}
            <div style={styles.sidebarTop}>
              <div style={styles.logoArea}>
                <div style={themeStyles.logoWrapper}>
                  <img
                    src="/logo.png"
                    alt="Logo"
                    width={32}
                    height={32}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-logo.png";
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      objectFit: "contain",
                      filter: "brightness(1.15) contrast(1.05)",
                    }}
                  />
                </div>
              </div>
              <button
                style={styles.iconBtn}
                title="Toggle sidebar"
                onClick={() => setSidebarOpen(false)}
              >
                <SidebarToggleIcon />
              </button>
            </div>

            {/* Nav Items */}
            <NavItem
              icon={<NewChatIcon />}
              label="New chat"
              itemStyle={themeStyles.navItem}
              onClick={handleNewChat}
            />
            <NavItem icon={<SearchIcon />} label="Search chats" itemStyle={themeStyles.navItem} />
            <NavItem
              icon={<BookIcon />}
              label="Reader"
              itemStyle={themeStyles.navItem}
              onClick={() => router.push("/reader")}
            />

            {/* Chat previews */}
            {chats.length > 0 && (
              <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                <div style={{ ...styles.sectionLabel, color: isLight ? "#6b7280" : "#8e8ea0" }}>
                  Recent
                </div>
                {chats.map((chat) => (
                  <ChatPreview
                    key={chat.id}
                    title={chat.title}
                    isActive={activeChatId === chat.id}
                    itemStyle={themeStyles.chatItem}
                    activeColor={isLight ? "#1a1a1a" : "#ececec"}
                    onClick={() => setActiveChatId(chat.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar toggle when collapsed */}
      {!sidebarOpen && (
        <button
          style={{
            ...styles.iconBtn,
            position: "fixed",
            left: 12,
            top: 12,
            zIndex: 50,
            background: isLight ? "rgba(0,0,0,0.08)" : "#2a2a2a",
            color: isLight ? "#1a1a1a" : "#b4b4b4",
          }}
          title="Open sidebar"
          onClick={() => setSidebarOpen(true)}
        >
          <SidebarToggleIcon />
        </button>
      )}

      {/* Main content */}
      <div style={themeStyles.main}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <button style={themeStyles.modelSelector}>
            Return of Agents
          </button>
          <ThemeToggle />
        </div>

        {/* Center - research results or greeting + input */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "0 16px",
          }}
        >
          {/* Research results view */}
          {researchQuery !== null && (
            <ResearchResults
              tavilyResults={tavilyResults}
              sedaResults={sedaResults}
              query={researchQuery}
              isLight={isLight}
              isLoading={researchLoading}
              rawResponses={lastRawResponses}
              onBack={() => {
                setResearchQuery(null);
                setTavilyResults([]);
                setSedaResults([]);
                setLastRawResponses({});
              }}
            />
          )}

          {/* Default center - greeting and input (when no research results) */}
          {researchQuery === null && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Only show greeting when no files uploaded */}
          {uploadedFiles.length === 0 && (
            <>
              <span style={themeStyles.readyText}>What would you like to read today?</span>
              {/* Upload button */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  disabled={pdfExtracting}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: isLight ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(255,255,255,0.2)",
                    background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)",
                    color: isLight ? "#1a1a1a" : "#ececec",
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: pdfExtracting ? "wait" : "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!pdfExtracting) e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.08)";
                  }}
                >
                  {pdfExtracting ? "Extracting PDF…" : "Upload"}
                </button>
              </div>
            </>
          )}
          {/* File UI - popup style when files uploaded (like second image) */}
          {uploadedFiles.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 400,
                width: "100%",
                padding: 20,
                borderRadius: 12,
                background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.1)",
                boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: isLight ? "#1a1a1a" : "#ececec" }}>
                  File{uploadedFiles.length > 1 ? "s" : ""}
                </span>
              </div>
              {uploadedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isLight ? "#1a1a1a" : "#ececec" }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{
                      ...styles.inputBtn,
                      padding: 4,
                      flexShrink: 0,
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={styles.inputArea}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <div style={themeStyles.inputBox}>
            <input
              ref={inputRef}
              style={themeStyles.inputField}
              placeholder="Search the web (Tavily + Seda)..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleResearchSearch(inputValue);
                }
              }}
              disabled={researchLoading}
            />
            <button
              type="button"
              style={styles.inputBtn}
              onClick={() => handleResearchSearch(inputValue)}
              disabled={researchLoading}
              title="Search"
            >
              {researchLoading ? (
                <span style={{ fontSize: 14 }}>⋯</span>
              ) : (
                <SendIcon />
              )}
            </button>
            <button
              type="button"
              style={{
                ...styles.inputBtn,
                ...(voiceListening ? { color: isLight ? "#dc2626" : "#f87171", background: isLight ? "rgba(220,38,38,0.1)" : "rgba(248,113,113,0.15)" } : {}),
              }}
              onClick={handleVoiceInput}
              disabled={researchLoading}
              title={voiceListening ? "Click to stop and add your speech" : "Click to speak, then click again when done"}
            >
              {voiceListening ? (
                <VoiceWaveform size={20} color={isLight ? "#dc2626" : "#f87171"} />
              ) : (
                <MicIcon />
              )}
            </button>
          </div>
          {voiceError && (
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6, textAlign: "center" }}>
              Voice: {voiceError === "not-allowed" ? "Microphone blocked. Allow mic in browser settings." : voiceError}
            </div>
          )}
          </div>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}