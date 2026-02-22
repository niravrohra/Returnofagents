// app/api/seda/search/route.ts
import { NextResponse } from "next/server";

const BASE = "https://api.getseda.com";

export async function GET(req: Request) {
  const AUTH_TOKEN = process.env.SEDA_AUTH_TOKEN;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }

  if (!AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Missing SEDA_AUTH_TOKEN (set it in .env.local)" },
      { status: 500 }
    );
  }

  const upstreamUrl = `${BASE}/research/search?q=${encodeURIComponent(
    q
  )}&limit=${limit}`;

  const upstreamRes = await fetch(upstreamUrl, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      cookie: `authToken=${AUTH_TOKEN}`,
      origin: "https://app.getseda.com",
      referer: "https://app.getseda.com/",
      "x-client-type": "web-app",
    },
  });

  const text = await upstreamRes.text();

  if (!upstreamRes.ok) {
    // surface SEDA’s error but still in JSON
    return NextResponse.json(
      {
        error: "Upstream failed",
        upstreamStatus: upstreamRes.status,
        upstreamBody: text.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  // Try to parse JSON, but if it’s not parseable, just return the raw text
  try {
    const json = text ? JSON.parse(text) : {};
    // 🔥 return EXACTLY what SEDA returned
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ raw: text });
  }
}