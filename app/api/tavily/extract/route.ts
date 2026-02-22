import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    return NextResponse.json(
      { error: "Missing TAVILY_API_KEY (set it in .env.local)" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const url = (body.url || "").trim();

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        urls: [url],
        extract_depth: "basic",
        format: "markdown",
      }),
    });

    const data = (await res.json()) as {
      results?: Array<{ url: string; raw_content?: string }>;
      failed_results?: Array<{ url: string; error: string }>;
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: "Tavily Extract failed", details: data },
        { status: 502 }
      );
    }

    const firstResult = data.results?.[0];
    const failed = data.failed_results?.[0];

    if (failed) {
      return NextResponse.json(
        { error: failed.error || "Failed to extract content", url: failed.url },
        { status: 422 }
      );
    }

    if (!firstResult?.raw_content) {
      return NextResponse.json(
        { error: "No content extracted from URL" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      url: firstResult.url,
      content: firstResult.raw_content,
    });
  } catch (err) {
    console.error("Tavily extract error:", err);
    return NextResponse.json(
      { error: "Extract failed", message: String(err) },
      { status: 500 }
    );
  }
}
