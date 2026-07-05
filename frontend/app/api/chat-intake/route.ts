/**
 * POST /api/chat-intake
 * =====================
 * Epic 3 / Lost Pet Intake — Structured-object streaming endpoint.
 *
 * Behavior:
 *   - Backend uses the Vercel AI SDK's `streamObject` with the Gemini
 *     `gemini-3.5-flash` model and a strict Zod schema. The model emits
 *     a JSON-lines text stream that the client parses incrementally
 *     using `experimental_useObject` from `@ai-sdk/react`.
 *   - The structured object captures the incrementally-extracted data
 *     the user provides across the conversation: species, breed,
 *     color/markings, collar/ID, last seen location.
 *   - A separate conversational reply is also streamed alongside
 *     ("assistantText") so the chat transcript mirrors the old UX.
 *     Currently both ride the same `streamObject` text response —
 *     `streamObject` writes the partial-object JSON in text form and
 *     Gemini's `system` instruction lays out the conversational tone.
 *
 *    - When CHAT_INTAKE_USE_MOCK=true (or when the GOOGLE_GENERATIVE_AI
 *      env var is missing AND `token` isn't required) we serve a small
 *      deterministic mock that emits the same JSON-lines shape. The
 *      mock path is gated behind a feature flag for explicit operator
 *      control; missing-key behavior is loud.
 *
 * Frontend contract:
 *   Request: { messages: {role, content}[] }
 *   Response: AI SDK text-stream response (text/plain; charset=utf-8)
 *             of partial JSON like:
 *               {"species":"dog","breed":null,"colorMarkings":"brown..."}
 *             The client `experimental_useObject` hook parses these
 *             partials and merges against the zodSchema.
 */

import { google } from "@ai-sdk/google";
import { Output, streamText } from "ai";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* -------------------------------------------------------------------------- */
/* Strict Zod object schema                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Strict structured-output schema. Each field is optional; the model
 * is instructed to leave fields `null` while they remain unconfirmed,
 * and to ask a single targeted clarifying question per turn.
 *
 * Field semantics:
 *   - species        enum of common pet categories (most concrete first)
 *   - breed          free-text (mixed breed allowed); null until stated
 *   - colorMarkings  free-text describing the most identifying visual cues
 *   - collarId       free-text — any combination of collar/harness/tags/chip
 *   - lastSeen       structured location: address-or-landmark + locality +
 *                    approximate time-of-day up to free-text details
 */
const lostPetIntakeSchema = z.object({
  species: z
    .enum([
      "dog",
      "cat",
      "rabbit",
      "bird",
      "ferret",
      "reptile",
      "fish",
      "other",
    ])
    .nullable()
    .describe(
      "Pet species if confirmed from the user. null until confirmed."
    ),
  breed: z
    .string()
    .nullable()
    .describe(
      "Breed of the pet (mixed breed is fine). null until confirmed."
    ),
  colorMarkings: z
    .string()
    .nullable()
    .describe(
      "Color and any distinctive markings. null until confirmed."
    ),
  collarId: z
    .string()
    .nullable()
    .describe(
      "Any collar, harness, tag, microchip or identifying apparel. " +
        "null until confirmed."
    ),
  lastSeen: z
    .object({
      address: z
        .string()
        .nullable()
        .describe("Street address or nearest cross-streets."),
      locality: z
        .string()
        .nullable()
        .describe("Neighborhood, landmark, or area name."),
      timeOfDay: z
        .string()
        .nullable()
        .describe("Approximate time-of-day the pet was last seen."),
      freeText: z
        .string()
        .nullable()
        .describe("Any other context the user shared about where the pet was."),
    })
    .nullable()
    .describe(
      "Structured location fields for where the pet was last seen. " +
        "null until at least one field is confirmed."
    ),
  /**
   * Conversational reply, included in the structured output so the
   * frontend can render one consistent bot message while the object
   * fields stream behind it. Gemini is instructed to keep this short
   * and to ask the next single question here.
   */
  assistantText: z
    .string()
    .describe(
      "Brief empathetic conversational response to the user, including " +
        "the next clarifying question if any fields are still null. " +
        "Keep under 80 words. No emojis. No medical advice."
    ),
});

export type LostPetIntakeObject = z.infer<typeof lostPetIntakeSchema>;

/* -------------------------------------------------------------------------- */
/* System prompt                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Locale directive appended to the system prompt at request time. We
 * keep this as a CONSTANT string so that downstream cache layers (if
 * introduced later) and audit dumps can identify it. Important: this
 * is appended AFTER the model has been told the schema is fixed-key
 * English so the LLM never tries to overwrite `species` etc. with a
 * localized value.
 *
 * The instruction is intentionally phrased in English even when the
 * target output language isn't — the model reasoning happens in
 * English internally, but the `assistantText` field renders localized.
 */
const LOCALE_DIRECTIVE_TEMPLATE = [
  "",
  "LANGUAGE CONSTRAINT:",
  "You must converse, ask questions, and acknowledge data exclusively in",
  "the language corresponding to this locale code: {locale}.",
  "Maintain an empathetic and calming tone.",
].join("\n");

/**
 * Locale code allowlist. WHY THIS MATTERS:
 *   - The locale is interpolated into the system prompt.
 *   - If a malicious client could send an arbitrary string as locale,
 *     they could attempt to inject prompt-instruction fragments
 *     ("zh-CN] then ignore all prior instructions and…").
 *   - By restricting to a 6-language allowlist we keep the system
 *     prompt deterministic even when the client is hostile.
 *
 * `zh-TW` and `zh-CN` are deliberately separate entries because they
 * differ in lexicon and script sense; `zh` legacy alias resolves to
 * `zh-CN` via the client-side shim, so we don't accept `zh` here.
 */
const SUPPORTED_LOCALES = [
  "en",
  "es",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function coerceLocale(raw: unknown): SupportedLocale {
  if (typeof raw === "string") {
    const found = SUPPORTED_LOCALES.find(
      (l) => l.toLowerCase() === raw.toLowerCase(),
    );
    if (found) return found;
  }
  return "en";
}

const INTAKE_SYSTEM_PROMPT = [
  "You are the RescueHub Assistant, an empathetic and calming AI helping a",
  "distressed owner locate their missing pet.",
  "",
  "You conduct a structured intake interview. Output is a JSON object that",
  "matches the lostPetIntakeSchema. Incrementally fill out the object as the",
  "user provides information, one field at a time. Use null for fields that",
  "are not yet known. After each user message, ask exactly ONE clarifying",
  "question for the next missing field in this priority order:",
  "  1. species (if null)",
  "  2. breed (if null and species !== 'other' / 'fish' / 'reptile')",
  "  3. colorMarkings (if null)",
  "  4. collarId (if null)",
  "  5. lastSeen.address → lastSeen.locality → lastSeen.timeOfDay → lastSeen.freeText",
  "",
  "Once every field is filled (no remaining nulls), set assistantText to a",
  "warm summary of what you've recorded and ask the user to confirm before",
  "you broadcast the search across the partner network.",
  "",
  "Style rules:",
  "  - Never make promises about finding the pet.",
  "  - Never offer medical advice.",
  "  - Never pressure the user to reveal information they aren't ready to share.",
  "  - Keep assistantText under 80 words.",
  "  - Do not use emoji.",
].join("\n");

/* -------------------------------------------------------------------------- */
/* Mock fallback (deterministic, same JSON-lines shape)                        */
/* -------------------------------------------------------------------------- */

function readMockTurn(text: string): Partial<LostPetIntakeObject> {
  const lower = text.toLowerCase();
  // Species detector
  if (/\b(?:dog|puppy)\b/.test(lower) && !/\b(?:cat|kitten)\b/.test(lower)) {
    return {
      species: "dog",
      assistantText:
        "Thank you for telling me. What kind of dog is it — a purebred or " +
        "mixed breed? (MOCK reply — set CHAT_INTAKE_USE_MOCK=false or " +
        "configure google provider for live Gemini.)",
    };
  }
  if (/\b(?:cat|kitten)\b/.test(lower)) {
    return {
      species: "cat",
      assistantText:
        "I understand — a cat. Could you share any breed cues? " +
        "(MOCK reply.)",
    };
  }
  if (/\b(?:rabbit|bird|parakeet|ferret|fish|reptile|turtle)\b/.test(lower)) {
    return { species: "other" };
  }
  if (/\b(?:lab|labrador|poodle|terrier|husky|bulldog|beagle|persian|siamese|tabby|maine coon|ragdoll|golden|german shepherd|french bulldog|mixed|mutt)\b/.test(lower)) {
    return {
      breed: text.slice(0, 80),
      assistantText: "Got it. What color are they, and any distinctive markings? (MOCK.)",
    };
  }
  if (/\b(?:black|white|brown|tan|grey|gray|red|orange|cream|golden|silver|spotted|striped|tabby|brindle|tricolor|calico|tortoiseshell)\b/.test(lower)) {
    return {
      colorMarkings: text.slice(0, 80),
      assistantText:
        "Thank you. Do they wear a collar, a harness, or have a microchip? (MOCK.)",
    };
  }
  if (/\b(?:collar|harness|tag|tagged|chip|microchipped|id plate|name tag|license|rabies tag|yes no|none)\b/.test(lower)) {
    return {
      collarId: text.slice(0, 80),
      assistantText:
        "Last question — where did you last see them? An address or neighborhood is fine. (MOCK.)",
    };
  }
  if (/\b(?:street|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|park|neighborhood|apartment|house|yard|farm|dock|trail|near|at|by|around|off)\b/.test(lower)) {
    return {
      lastSeen: {
        address: /\d+\s+\w+\s+(?:street|ave|avenue|road|rd|drive|dr|blvd|boulevard|lane|ln)/.test(lower)
          ? text.slice(0, 120)
          : null,
        locality: /\b(?:park|neighborhood|downtown)\b/.test(lower)
          ? (text.match(/\b(?:[A-Z][\w]+(?:\s+[A-Z][\w]+)*)\s+(?:Park|Neighborhood|Downtown)\b/)?.[0] ?? null)
          : null,
        timeOfDay: /\b(?:morning|afternoon|evening|night|midnight|yesterday|today)\b/.test(lower)
          ? (text.match(/\b(?:morning|afternoon|evening|night|midnight|yesterday|today)\b/)?.[0] ?? null)
          : null,
        freeText: text.slice(0, 240),
      },
      assistantText:
        "I have everything I need. Could you confirm before I broadcast to " +
        "the partner network? (MOCK reply.)",
    };
  }
  return {
    assistantText:
      "I'm so sorry your pet is missing. To begin, what kind of pet are " +
      "you looking for? (MOCK reply.)",
  };
}

function buildMockStream(
  history: { role: string; content: string }[]
): Response {
  const last =
    history.filter((m) => m.role === "user").slice(-1)[0]?.content ?? "";
  const partial = readMockTurn(last);

  // Build a JSON-lines stream carrying the partial object on a single
  // line. The `useObject` hook treats each non-blank line as a partial
  // JSON patch it can attempt to merge with the schema.
  const object: LostPetIntakeObject = {
    species: null,
    breed: null,
    colorMarkings: null,
    collarId: null,
    lastSeen: null,
    assistantText:
      "I'm so sorry your pet is missing — let's find them together. " +
      "What kind of pet are you looking for? (MOCK reply.)",
    ...partial,
  };

  const body = JSON.stringify(object);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      await new Promise((r) => setTimeout(r, 80));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-rescuehub-chat-intake-mode": "mock",
    },
  });
}

/* -------------------------------------------------------------------------- */
/* POST handler                                                               */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Multi-modal content typing & validation                                    */
/* -------------------------------------------------------------------------- */

/**
 * Server-side mirror of the AI SDK's UserContent array shape — only the
 * fields we accept from the wire. We re-validate the part shape here so
 * a hostile client can't smuggle arbitrary payloads past the JSON parser
 * into `streamText()` (which otherwise would forward whatever is in the
 * messages[] array directly to Gemini).
 *
 * Image payload limit: 5 MB. The frontend already caps at the same
 * number, but a malicious or buggy client could bypass the cap; this
 * server check is the authoritative gate before the bytes ever leave
 * the Next.js worker.
 */
type WirePart =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mediaType?: string };

const ALLOWED_PART_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_TEXT_BYTES = 32 * 1024; // 32 KB

function decodeDataUrl(dataUrl: string): { mime: string; base64Bytes: number } | null {
  // Format: data:<mime>;base64,<payload>
  if (typeof dataUrl !== "string") return null;
  const match = /^data:([^;,]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "";
  // Approximate the decoded byte length from the base64 length —
  // base64 inflates by ~4/3, so decoded = (b64_len * 3) / 4, ignoring padding.
  const b64 = match[2] || "";
  const decodedBytes = Math.floor((b64.length * 3) / 4);
  return { mime, base64Bytes: decodedBytes };
}

function normalizePart(raw: unknown): WirePart | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = obj["type"];
  if (type === "text") {
    const text = obj["text"];
    if (typeof text !== "string") return null;
    if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) return null;
    return { type: "text", text };
  }
  if (type === "image") {
    const image = obj["image"];
    const mediaType = obj["mediaType"];
    if (typeof image !== "string") return null;
    const decoded = decodeDataUrl(image);
    if (!decoded) return null;
    const mime =
      typeof mediaType === "string" && mediaType.length > 0
        ? mediaType
        : decoded.mime;
    if (!ALLOWED_PART_MIME.has(mime.toLowerCase())) return null;
    if (decoded.base64Bytes > MAX_IMAGE_BYTES) return null;
    return { type: "image", image, mediaType: mime };
  }
  return null;
}

function normalizeWireContent(raw: unknown):
  | string
  | WirePart[]
  | null {
  if (typeof raw === "string") {
    if (Buffer.byteLength(raw, "utf8") > MAX_TEXT_BYTES) return null;
    return raw;
  }
  if (Array.isArray(raw)) {
    const out: WirePart[] = [];
    for (const item of raw) {
      const norm = normalizePart(item);
      if (!norm) return null;
      out.push(norm);
    }
    if (out.length === 0) return null;
    return out;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages: { role: string; content: unknown }[];
      locale?: string;
    };
    if (!Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "messages must be an array" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    // Each entry may carry `string` content (text-only turn) or a parts
    // array (multimodal turn). Reject any entry whose shape fails the
    // allowlist — fail-closed so a hostile client can't slip a payload
    // to streamText that bypasses the UserContent contract.
    const messages: Array<{
      role: "user" | "assistant" | "system";
      content: string | WirePart[];
    }> = [];
    for (const m of body.messages) {
      const role = m.role as "user" | "assistant" | "system";
      if (role !== "user" && role !== "assistant" && role !== "system") {
        return new Response(
          JSON.stringify({ error: `invalid role: ${String(m.role)}` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      const content = normalizeWireContent(m.content);
      if (content == null) {
        return new Response(
          JSON.stringify({
            error:
              "invalid message content (expected string or parts[] of text/image)",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      messages.push({ role, content });
    }
    // Sanitize locale against the allowlist before injecting into the
    // system prompt — defense against prompt-injection attempts.
    const locale = coerceLocale(body.locale);

    // Feature-flag driven mock fallback.
    if (
      process.env.CHAT_INTAKE_USE_MOCK === "true" ||
      process.env.CHAT_INTAKE_USE_MOCK === "1"
    ) {
      return buildMockStream(messages);
    }

    // No GEMINI key → return a clean 503 so the client `experimental_useObject`
    // surfaces an `error` state instead of the SDK mis-throwing.
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Chat intake is not configured: GOOGLE_GENERATIVE_AI_API_KEY is " +
            "missing and CHAT_INTAKE_USE_MOCK is not set. Use the mock by " +
            "setting CHAT_INTAKE_USE_MOCK=true.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const localizedSystemPrompt =
      INTAKE_SYSTEM_PROMPT.join(" ") +
      LOCALE_DIRECTIVE_TEMPLATE.replace("{locale}", locale);

    const result = streamText({
      model: google("gemini-3.5-flash"),
      system: localizedSystemPrompt,
      messages,
      output: Output.object({
        schema: lostPetIntakeSchema,
      }),
    });

    const response = result.toTextStreamResponse();
    // Reflect the locale + mode used so dev/inspection tooling can confirm
    // the right directive made it into the prompt and the response is live.
    response.headers.set("x-rescuehub-chat-intake-locale", locale);
    response.headers.set("x-rescuehub-chat-intake-mode", "live");
    return response;
  } catch (error) {
    console.error("🔥 [api/chat-intake] FATAL:", error);
    return new Response(
      JSON.stringify({ error: "chat-intake failed", detail: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
