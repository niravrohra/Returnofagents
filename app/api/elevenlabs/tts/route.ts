import { NextResponse } from "next/server";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY (set it in .env.local)" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { text, voiceId } = body as { text: string; voiceId?: string };
    const voice = voiceId || DEFAULT_VOICE_ID;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_64&optimize_streaming_latency=3`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 5000),
          model_id: "eleven_flash_v2_5",
        }),
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: "ElevenLabs TTS failed", details: err },
        { status: 502 }
      );
    }

    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("ElevenLabs TTS error:", err);
    return NextResponse.json(
      { error: "TTS failed", message: String(err) },
      { status: 500 }
    );
  }
}
