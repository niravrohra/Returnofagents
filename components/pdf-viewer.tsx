"use client";

import { useEffect, useState, useRef } from "react";

type PDFViewerProps = {
  url: string;
  isLight: boolean;
};

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (src: string) => { promise: Promise<{ numPages: number; getPage: (n: number) => Promise<unknown> }> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

export function PDFViewer({ url, isLight }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || typeof window === "undefined") return;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      if (!window.pdfjsLib) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF.js"));
        });

        (window as Window & { pdfjsLib: { GlobalWorkerOptions: { workerSrc: string } } }).pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      try {
        const pdfjsLib = (window as Window & { pdfjsLib: typeof window.pdfjsLib }).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF.js not loaded");

        const pdf = await pdfjsLib.getDocument(url).promise;
        const pages = pdf.numPages;
        setNumPages(pages);

        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";

        const availableWidth = container.clientWidth - 24;
        const basePageWidth = Math.max(500, Math.min(availableWidth, 900));
        const scale = 1.5;
        const gap = 20;

        for (let i = 1; i <= pages; i++) {
          const page = await pdf.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({
            scale: (basePageWidth / baseViewport.width) * scale,
          });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${basePageWidth}px`;
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.pointerEvents = "none";

          const wrapper = document.createElement("div");
          wrapper.style.cssText = `
            margin-bottom: ${gap}px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: ${isLight ? "0 8px 32px rgba(0,0,0,0.08)" : "0 8px 32px rgba(0,0,0,0.35)"};
            background: #fff;
            position: relative;
          `;
          const canvasWrapper = document.createElement("div");
          canvasWrapper.style.cssText = `
            position: relative;
            width: ${basePageWidth}px;
            max-width: 100%;
          `;
          canvasWrapper.appendChild(canvas);

          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "pdf-text-layer";
          const displayHeight = (viewport.height / viewport.width) * basePageWidth;
          textLayerDiv.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: ${basePageWidth}px;
            height: ${displayHeight}px;
            overflow: hidden;
            line-height: 1;
            -webkit-user-select: text;
            user-select: text;
            pointer-events: auto;
            z-index: 1;
          `;

          try {
            const textContent = await page.getTextContent();
            const scaleX = basePageWidth / viewport.width;
            const scaleY = basePageWidth / viewport.width;
            (textContent as { items: { str: string; transform: number[] }[] }).items.forEach((item) => {
              const span = document.createElement("span");
              span.textContent = item.str;
              const tx = item.transform;
              const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]) * scaleX;
              span.style.cssText = `
                position: absolute;
                left: ${tx[4] * scaleX}px;
                top: ${(viewport.height - tx[5]) * scaleY}px;
                font-size: ${fontSize}px;
                white-space: pre;
                color: transparent;
                cursor: text;
                -webkit-user-select: text;
                user-select: text;
              `;
              textLayerDiv.appendChild(span);
            });
          } catch {
            /* text layer optional */
          }
          canvasWrapper.appendChild(textLayerDiv);

          const pageLabel = document.createElement("div");
          pageLabel.textContent = `Page ${i} of ${pages}`;
          pageLabel.style.cssText = `
            position: absolute;
            bottom: 8px;
            right: 12px;
            font-size: 11px;
            color: rgba(0,0,0,0.4);
            font-family: system-ui, sans-serif;
            z-index: 2;
          `;
          wrapper.appendChild(canvasWrapper);
          wrapper.appendChild(pageLabel);
          container.appendChild(wrapper);

          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
          });
          await renderTask.promise;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [url, isLight]);

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#ef4444" }}>
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px 16px 32px",
        width: "100%",
        minHeight: 200,
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: 48,
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          Loading PDF...
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          visibility: loading ? "hidden" : "visible",
        }}
      />
    </div>
  );
}
