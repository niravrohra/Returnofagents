import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

  if (!MINIMAX_API_KEY) {
    return NextResponse.json(
      { error: "Missing MINIMAX_API_KEY (set it in .env.local)" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { messages, context } = body as {
      messages: Array<{ role: string; content: string }>;
      context?: {
        pageTitle?: string;
        documentContent?: string;
        contextAroundSelection?: string;
        selectedText?: string;
        sophistication?: number;
      };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
    }

    const soph = typeof context?.sophistication === "number" ? Math.max(0, Math.min(100, context.sophistication)) : 50;
    const levelHint =
      soph < 20
        ? "Explain in the simplest possible terms, like for a child. Use very short sentences and everyday words."
        : soph < 50
          ? "Explain in simple, accessible terms. Avoid jargon. Use plain language."
          : soph < 80
            ? "Explain clearly with some nuance. You may use standard technical terms when helpful."
            : "Explain in a sophisticated, detailed way. Assume the reader can follow technical or specialized language.";

    const docSection = context?.documentContent
      ? `\n\nHere is the full document the user is reading (use it to answer any questions about its content):\n\n---\n${context.documentContent}\n---\n\n`
      : context?.contextAroundSelection
        ? `\n\nHere is the relevant context (lines around the selection):\n\n${context.contextAroundSelection}\n\n`
        : "";

    const systemContent = context
      ? `You are a helpful assistant. The user is reading a page titled "${context.pageTitle || "this document"}".${docSection}${
          context.selectedText
            ? `The user has selected this text: "${context.selectedText}"\n\nExplain it in context. ${levelHint}`
            : `Answer the user's questions about the document based on the content above. ${levelHint}`
        }`
      : "You are a helpful assistant. Answer clearly and concisely.";

    const apiMessages = [
      { role: "system" as const, name: "MiniMax AI", content: systemContent },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        name: m.role === "user" ? "user" : "MiniMax AI",
        content: m.content,
      })),
    ];

    const res = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.5",
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      base_resp?: { status_code?: number; status_msg?: string };
    };

    if (!res.ok) {
      return NextResponse.json(
        { error: "MiniMax chat failed", details: data },
        { status: 502 }
      );
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "MiniMax returned empty response", details: data },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (err) {
    console.error("Minimax chat error:", err);
    return NextResponse.json(
      { error: "Chat failed", message: String(err) },
      { status: 500 }
    );
  }
}
