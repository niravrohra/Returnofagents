"use client";

import { useState, useRef, useCallback } from "react";

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((e: { results: { length: number; [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function unlockAudio(): void {
  try {
    const Ctx = typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (Ctx) {
      const ctx = new Ctx();
      ctx.resume();
    }
    const a = new Audio(SILENT_WAV);
    a.volume = 0;
    a.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let currentOnEnd: (() => void) | null = null;

function cleanup(): void {
  if (currentUrl) {
    try {
      URL.revokeObjectURL(currentUrl);
    } catch {
      /* ignore */
    }
    currentUrl = null;
  }
  currentAudio = null;
  currentOnEnd?.();
  currentOnEnd = null;
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
    cleanup();
  }
}

export async function speakText(
  text: string,
  opts?: { onStart?: () => void; onEnd?: () => void }
): Promise<void> {
  stopSpeaking();

  const clean = stripMarkdown(text).slice(0, 5000);
  if (!clean) return;

  unlockAudio();
  opts?.onStart?.();

  const res = await fetch("/api/elevenlabs/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: clean }),
  });

  if (!res.ok) {
    opts?.onEnd?.();
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  currentUrl = url;
  const audio = new Audio(url);
  currentAudio = audio;
  currentOnEnd = opts?.onEnd ?? null;

  audio.onended = () => {
    cleanup();
  };

  try {
    await audio.play();
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "NotAllowedError") {
      cleanup();
    }
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const start = useCallback((onResult: (text: string) => void) => {
    const win = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }) : null;
    const SpeechRecognitionAPI = win && (win.SpeechRecognition || win.webkitSpeechRecognition);

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported");
      return;
    }

    setError(null);
    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal && result.length > 0) {
          transcript += result[0].transcript;
          if (i < e.results.length - 1) transcript += " ";
        }
      }
      if (transcript) finalTranscript = transcript;
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "aborted") setError(e.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { start, stop, isListening, error };
}
