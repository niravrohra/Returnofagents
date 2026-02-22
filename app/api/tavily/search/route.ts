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
    const query = (body.query || "").trim();
    const maxResults = Math.min(Number(body.max_results) || 10, 20);

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    let res: Response;
    let text: string;
    const fetchOpts = {
      method: "POST" as const,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
      }),
    };

    res = await fetch("https://api.tavily.com/search", fetchOpts);
    text = await res.text();

    if (res.status === 502) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await fetch("https://api.tavily.com/search", fetchOpts);
      text = await res.text();
    }
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { error: "Tavily returned invalid JSON", status: res.status, body: text?.slice(0, 500) },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const err = typeof data === "object" && data && "detail" in data
        ? (data as { detail?: { error?: string } }).detail?.error
        : (data as { error?: string })?.error;
      return NextResponse.json(
        { error: err || "Tavily API failed", details: data },
        { status: 502 }
      );
    }

    return NextResponse.json(data as Record<string, unknown>);
  } catch (err) {
    console.error("Tavily search error:", err);
    return NextResponse.json(
      { error: "Tavily search failed", message: String(err) },
      { status: 500 }
    );
  }
}
