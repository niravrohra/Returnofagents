import { NextRequest, NextResponse } from "next/server";
import pdf2md from "@opendocsg/pdf2md";
import { normalizeMarkdown } from "@/lib/markdown-utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const markdown = await pdf2md(uint8);
    const normalized = normalizeMarkdown(markdown);

    return NextResponse.json({ markdown: normalized });
  } catch (err) {
    console.error("PDF to Markdown error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to convert PDF" },
      { status: 500 }
    );
  }
}
