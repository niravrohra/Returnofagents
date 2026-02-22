import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const NUTRIENT_API_KEY = process.env.NUTRIENT_API_KEY;

  if (!NUTRIENT_API_KEY) {
    return NextResponse.json(
      { error: "Missing NUTRIENT_API_KEY (set it in .env.local)" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    const instructions = {
      parts: [{ file: "document" }],
      output: {
        type: "json-content",
        plainText: true,
        structuredText: false,
      },
    };

    const nutrientFormData = new FormData();
    nutrientFormData.append("document", file, file.name || "document.pdf");
    nutrientFormData.append("instructions", JSON.stringify(instructions));

    const res = await fetch("https://api.nutrient.io/build", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NUTRIENT_API_KEY}`,
      },
      body: nutrientFormData,
      signal: AbortSignal.timeout(120_000),
    });

    const data = (await res.json()) as {
      pages?: Array<{ plainText?: string }>;
      error?: string;
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || "Nutrient extraction failed", details: data },
        { status: 502 }
      );
    }

    const text = data.pages
      ?.map((p) => p.plainText ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "No text extracted from PDF" },
        { status: 422 }
      );
    }

    const title = file.name?.replace(/\.pdf$/i, "") || "PDF Document";

    return NextResponse.json({ title, content: text });
  } catch (err) {
    console.error("Nutrient extract error:", err);
    return NextResponse.json(
      { error: "PDF extraction failed", message: String(err) },
      { status: 500 }
    );
  }
}
