/**
 * Resolve a chat LanguageModel from the first configured OpenAI-compatible
 * gateway. TeamoRouter and FreeLLMAPI fund *compute* for Find My Pet — they
 * do not mint RescueHub wallet tokens. Wallet grants stay server-side.
 */
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type LlmVia = "teamorouter" | "freellmapi" | "gemini";

type ChatModel = NonNullable<Parameters<typeof streamText>[0]["model"]>;

export type ResolvedChatModel = {
  model: ChatModel;
  via: LlmVia;
};

function firstKey(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Official OpenAI-compatible origin. `.cc` does not resolve; `/v1` is required. */
export const TEAMOROUTER_DEFAULT_BASE_URL = "https://api.teamorouter.com/v1";

export function normalizeTeamoBaseUrl(raw?: string | null): string {
  if (!raw?.trim()) return TEAMOROUTER_DEFAULT_BASE_URL;
  let url = raw.trim().replace(/\/+$/, "");
  url = url.replace(
    /^(https?:\/\/)api\.teamorouter\.cc\b/i,
    "$1api.teamorouter.com",
  );
  if (!/\/v1$/i.test(url)) url = `${url}/v1`;
  return url;
}

export function hasAnyLlmKey(): boolean {
  return Boolean(
    firstKey("TEAMOROUTER_API_KEY") ||
      firstKey("FREELLMAPI_API_KEY") ||
      firstKey("GOOGLE_GENERATIVE_AI_API_KEY"),
  );
}

export function resolveChatModel(): ResolvedChatModel | null {
  const teamo = firstKey("TEAMOROUTER_API_KEY");
  if (teamo) {
    const openai = createOpenAI({
      name: "teamorouter",
      apiKey: teamo,
      baseURL: normalizeTeamoBaseUrl(firstKey("TEAMOROUTER_BASE_URL")),
    });
    const id = firstKey("TEAMOROUTER_MODEL") ?? "gemini-3.5-flash";
    return { model: openai.chat(id), via: "teamorouter" };
  }

  const free = firstKey("FREELLMAPI_API_KEY");
  if (free) {
    const openai = createOpenAI({
      name: "freellmapi",
      apiKey: free,
      baseURL: firstKey("FREELLMAPI_BASE_URL") ?? "http://localhost:3001/v1",
    });
    const id = firstKey("FREELLMAPI_MODEL") ?? "auto";
    return { model: openai.chat(id), via: "freellmapi" };
  }

  if (firstKey("GOOGLE_GENERATIVE_AI_API_KEY")) {
    return { model: google("gemini-3.5-flash"), via: "gemini" };
  }

  return null;
}

export function missingLlmMessage(): string {
  return (
    "No LLM key is configured. Set TEAMOROUTER_API_KEY, FREELLMAPI_API_KEY, " +
    "or GOOGLE_GENERATIVE_AI_API_KEY (never commit keys). " +
    "Or set CHAT_INTAKE_USE_MOCK=true for a local mock."
  );
}
