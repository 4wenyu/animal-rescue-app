import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google("gemini-3.5-flash"),
      system:
        "You are the RescueHub Assistant, an empathetic and calming AI designed to help distressed owners find their pets...",
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    // THIS is the trap!
    console.error("🔥 FATAL API ERROR:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
}