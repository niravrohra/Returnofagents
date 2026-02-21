"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Configure PDF.js worker for react-pdf (must match pdfjs-dist version)
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PDFViewerProps = {
  url: string;
  isLight: boolean;
};

export function PDFViewer({ url, isLight }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === "undefined") return;
      const el = document.querySelector("[data-pdf-container]");
      if (el) {
        const w = (el as HTMLElement).clientWidth - 24;
        setContainerWidth(Math.max(500, Math.min(w, 900)));
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const onLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setLoading(false);
    setError(null);
  };

  const onLoadError = (err: Error) => {
    setError(err?.message || "Failed to load PDF");
    setLoading(false);
  };

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#ef4444" }}>
        {error}
      </div>
    );
  }

  const gap = 20;
  const pageWidth = containerWidth;

  return (
    <div
      data-pdf-container
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
      <Document
        file={url}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={null}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={i}
            style={{
              marginBottom: gap,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: isLight
                ? "0 8px 32px rgba(0,0,0,0.08)"
                : "0 8px 32px rgba(0,0,0,0.35)",
              background: "#fff",
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 12,
                  fontSize: 11,
                  color: "rgba(0,0,0,0.4)",
                  fontFamily: "system-ui, sans-serif",
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                Page {i + 1} of {numPages}
              </div>
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
