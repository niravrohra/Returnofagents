// app/api/seda/chain/route.ts
import { NextResponse } from "next/server";

const BASE = "https://api.getseda.com";

export async function GET(req: Request) {
  const AUTH_TOKEN = process.env.SEDA_AUTH_TOKEN;

  if (!AUTH_TOKEN) {
    return NextResponse.json(
      { error: "Missing SEDA_AUTH_TOKEN in env" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const chainId = searchParams.get("chainId");

  if (!chainId) {
    return NextResponse.json(
      { error: "Missing chainId" },
      { status: 400 }
    );
  }

  const upstreamUrl = `${BASE}/chain/${encodeURIComponent(
    chainId
  )}/enhanced-history`;

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
    return NextResponse.json(
      {
        error: "Upstream failed",
        upstreamStatus: upstreamRes.status,
        upstreamBody: text.slice(0, 1000),
      },
      { status: 502 }
    );
  }

  try {
    const json = text ? JSON.parse(text) : {};
    // just return whatever SEDA returns
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ raw: text });
  }
}