import { streamText } from "ai";
import { z } from "zod";

import { missingLlmMessage, resolveChatModel } from "@/lib/llm/provider";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { chatSystemPrompt, type ChatSurface } from "@/lib/chatPrompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ── Request limits ────────────────────────────────────────────────────── */
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
// Image parts ride as data URLs, so they need a larger ceiling than text —
// capped to a 5 MB binary (~1.34x as base64).
const MAX_IMAGE_URL_CHARS = Math.ceil((5 * 1024 * 1024 * 4) / 3);

const TextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(MAX_MESSAGE_CHARS),
});

const ImagePartSchema = z.object({
  type: z.literal("image"),
  image: z.string().min(1).max(MAX_IMAGE_URL_CHARS),
  mediaType: z.string().max(100).optional(),
});

// Client `system` role is rejected: the server owns the system prompt, so a
// hostile client cannot rewrite assistant behavior via a planted message.
// Discriminated on `role` so the parsed result structurally matches the AI
// SDK's `ModelMessage` union (a plain object with `role: z.enum([...])` cannot
// be narrowed to `UserModelMessage | AssistantModelMessage`).
const ChatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z.union([
      z.string().max(MAX_MESSAGE_CHARS),
      z.array(z.union([TextPartSchema, ImagePartSchema])).max(3),
    ]),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.string().max(MAX_MESSAGE_CHARS),
  }),
]);

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(MAX_MESSAGES),
  surface: z.enum(["general", "adopt", "lost"]).optional(),
});

export async function POST(req: Request) {
  // Public chatbot used by anonymous visitors — throttle per IP.
  const ip = getClientIp(req);
  const { ok, retryAfterSeconds } = await checkRateLimitAsync(`chat:${ip}`, 10, 60 * 1000);
  if (!ok) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  try {
    const parsed = ChatRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return Response.json(
        {
          error:
            `Invalid request: messages must be 1–${MAX_MESSAGES} items; ` +
            `text content ≤ ${MAX_MESSAGE_CHARS} characters; "system" role not allowed.`,
        },
        { status: 400 },
      );
    }

    const surface: ChatSurface = parsed.data.surface ?? "general";
    const routed = resolveChatModel();
    if (!routed) {
      return Response.json({ error: missingLlmMessage() }, { status: 503 });
    }
    const result = await streamText({
      model: routed.model,
      system: chatSystemPrompt(surface),
      messages: parsed.data.messages,
    });

    const response = result.toTextStreamResponse();
    response.headers.set("x-rescuehub-llm", routed.via);
    return response;
  } catch (error) {
    // Log server-side; never echo internals (e.g. String(error)) to the client.
    console.error("🔥 FATAL API ERROR:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500 });
  }
}
