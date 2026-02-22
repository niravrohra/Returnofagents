import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY (set it in .env.local)" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { explanation, selectionText } = body as {
      explanation: string;
      selectionText?: string;
    };

    const topic = selectionText?.trim() || explanation?.trim().slice(0, 300);
    if (!topic) {
      return NextResponse.json({ error: "Missing explanation or selectionText" }, { status: 400 });
    }

    const prompt = `Generate a single fun, colorful cartoon or comic strip illustration that explains this topic in a playful, educational way: "${topic}". 
Style: Simple cartoon characters, clear visual metaphors, comic-book or editorial cartoon feel. Make it engaging and easy to understand at a glance. Output one image only.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.slice(0, 4000) }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
        signal: AbortSignal.timeout(90_000),
      }
    );

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
        };
      }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gemini image generation failed", details: data.error?.message || data },
        { status: 502 }
      );
    }

    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    const mimeType = imagePart?.inlineData?.mimeType || "image/png";
    const base64 = imagePart?.inlineData?.data;

    if (!base64) {
      return NextResponse.json(
        { error: "No image in response", details: data },
        { status: 502 }
      );
    }

    const url = `data:${mimeType};base64,${base64}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Gemini image error:", err);
    return NextResponse.json(
      { error: "Image generation failed", message: String(err) },
      { status: 500 }
    );
  }
}
