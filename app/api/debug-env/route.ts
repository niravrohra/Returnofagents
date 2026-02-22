import { NextResponse } from "next/server";

/** Debug endpoint to verify env vars are loaded. Visit /api/debug-env */
export async function GET() {
  return NextResponse.json({
    TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
    SEDA_AUTH_TOKEN: !!process.env.SEDA_AUTH_TOKEN,
    NUTRIENT_API_KEY: !!process.env.NUTRIENT_API_KEY,
    MINIMAX_API_KEY: !!process.env.MINIMAX_API_KEY,
    ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
  });
}
