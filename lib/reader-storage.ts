export type ReaderItem = {
  id: string;
  title: string;
  content: string;
  url?: string;
  source: "tavily" | "seda" | "pdf";
  addedAt: number;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "readerItems";
const CHAT_PREFIX = "readerChat:";
const COLLAPSED_PREFIX = "readerCollapsed:";

export function getReaderItems(): ReaderItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addReaderItem(item: Omit<ReaderItem, "id" | "addedAt">): ReaderItem {
  const full: ReaderItem = {
    ...item,
    id: `reader-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    addedAt: Date.now(),
  };
  const items = getReaderItems();
  items.unshift(full);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return full;
}

export function removeReaderItem(id: string): void {
  const items = getReaderItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  try {
    localStorage.removeItem(CHAT_PREFIX + id);
    localStorage.removeItem(COLLAPSED_PREFIX + id);
  } catch { /* ignore */ }
}

export function updateReaderItem(id: string, updates: Partial<Pick<ReaderItem, "title" | "content">>): void {
  const items = getReaderItems().map((i) => (i.id === id ? { ...i, ...updates } : i));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getChatHistory(itemId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + itemId);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setChatHistory(itemId: string, messages: ChatMessage[]): void {
  try {
    if (messages.length === 0) {
      localStorage.removeItem(CHAT_PREFIX + itemId);
    } else {
      localStorage.setItem(CHAT_PREFIX + itemId, JSON.stringify(messages));
    }
  } catch { /* ignore */ }
}

export function getChatCollapsed(itemId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(COLLAPSED_PREFIX + itemId);
    if (raw === null) return false;
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
}

export function setChatCollapsed(itemId: string, collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_PREFIX + itemId, JSON.stringify(collapsed));
  } catch { /* ignore */ }
}
