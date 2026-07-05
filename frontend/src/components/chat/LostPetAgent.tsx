"use client";

/**
 * LostPetAgent — Epic 3 / AI Agent Outreach Engine
 * ==================================================
 * Conversational intake surface for the Lost Pet Search service.
 *
 * V2 architecture (replaces V0 keyword-scanner):
 *   - Backend `/api/chat-intake/route.ts` streams a structured Zod object
 *     via `streamObject` from the Vercel AI SDK. The object contains both
 *     a conversational `assistantText` reply AND the captured fields
 *     (species, breed, colorMarkings, collarId, lastSeen.*).
 *   - Frontend consumes that stream via `experimental_useObject` from
 *     `@ai-sdk/react`. The hook returns a `DeepPartial<RESULT>` that
 *     updates field-by-field as Gemini writes JSON.
 *   - The chat transcript is managed locally with `useState`. Each turn:
 *       1. User submits a message → pushed to transcript immediately.
 *       2. `object.assistantText` is rendered in place of a streaming
 *          assistant message bubble; on stream finish it's promoted into
 *          the transcript so subsequent context survives.
 *   - The right-hand sidebar reads `object?.species`, `object?.breed`,
 *     … directly. The moment a field is non-null/non-empty, that card
 *     flips to emerald/complete.
 *
 * This V2 has a subtle constraint: the hook returns ONE partial object
 * at a time. We accumulate object state across turns by snapshotting
 * `object` into `accumulated` (a local state) on stream finish — so
 * fields captured in earlier turns aren't dropped when the next
 * `object`stream supersedes them.
 */

import { experimental_useObject } from "@ai-sdk/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Heart,
  Loader2,
  MapPin,
  PawPrint,
  Rocket,
  Send,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Locale JSON — mirrors the project pattern from FloatingChatbot.tsx.
// All 7 locales (legacy "zh" alias resolves to zh-CN via the codebase's
// existing shim — see LOCALE_DICTS below).
import enDict from "../../../locales/en.json";
import esDict from "../../../locales/es.json";
import zhCNDict from "../../../locales/zh-CN.json";
import zhTWDict from "../../../locales/zh-TW.json";
import jaDict from "../../../locales/ja.json";
import koDict from "../../../locales/ko.json";
import zhLegacyDict from "../../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
  zh: zhLegacyDict as unknown as Record<string, unknown>,
};
const LOCALE_STORAGE_KEY = "rescuehub_locale";
const LOCALE_CHANGE_EVENT = "rescuehub-locale-change";

type LocaleCode = "en" | "es" | "zh-CN" | "zh-TW" | "ja" | "ko";

function resolveStoredLocale(stored: string | null): LocaleCode {
  if (
    stored === "en" ||
    stored === "es" ||
    stored === "zh-CN" ||
    stored === "zh-TW" ||
    stored === "ja" ||
    stored === "ko"
  ) {
    return stored;
  }
  return "en";
}

/**
 * English fallback used during SSR (so the chat window renders correctly
 * before hydration). Mirrors FloatingChatbot's EN_FALLBACK but only covers
 * the keys this component consumes; any new chatIntake key not in here is
 * returned verbatim by `tr()` so devs can spot the gap locally.
 */
const EN_FALLBACK: Record<string, string> = {
  "chatIntake.greeting":
    "I am so sorry your pet is missing. I'm here to help you find them. Take a deep breath—what kind of pet are you looking for, and where did you last see them?",
  "chatIntake.sidebar_title": "Intake progress",
  "chatIntake.sidebar_help_species": "Dog, cat, rabbit, bird, other",
  "chatIntake.sidebar_help_breed": "Labrador, tabby, parakeet, mixed",
  "chatIntake.sidebar_help_color": "Primary markings, fur/feather color",
  "chatIntake.sidebar_help_collar": "Tags, microchip, harness color, ID plate",
  "chatIntake.sidebar_help_last_seen": "Address, cross-streets, neighborhood, landmark",
  "chatIntake.label_species": "Species",
  "chatIntake.label_breed": "Breed",
  "chatIntake.label_color": "Color & markings",
  "chatIntake.label_collar": "Collar & ID",
  "chatIntake.label_last_seen": "Last seen",
  "chatIntake.input_placeholder": "Tell me about your pet…",
  "chatIntake.send_label": "Send message",
  "chatIntake.ready_to_broadcast": "Intake complete · ready to broadcast",
  "chatIntake.activate_button": "🚀 Activate Search Network",
  "chatIntake.activating_label": "Activating…",
  "chatIntake.private_note":
    "Conversations are treated as confidential intake records. Tokens have already been debited for this search.",
  "chatIntake.wallet_balance_label": "Wallet balance:",
  "chatIntake.wallet_balance_unit": "tokens",
  "chatIntake.stream_unavailable_title":
    "Sorry — the intake stream hit an error. Please try again in a moment. ({error})",
};

function trFor(
  locale: string,
  key: string,
  vars?: Record<string, string>,
): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) {
      value = EN_FALLBACK[key] ?? key;
      break;
    }
    value = (value as Record<string, unknown>)[p];
  }
  if (typeof value !== "string") return EN_FALLBACK[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    value,
  );
}

/* -------------------------------------------------------------------------- */
/* Schema (mirrors backend route.ts)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Documenting on the client because `experimental_useObject` requires a
 * schema reference (its current implementation passes the value through,
 * but it documents the contract). The server is the authoritative
 * validator.
 */
const lostPetIntakeSchema = z.object({
  species: z
    .enum(["dog", "cat", "rabbit", "bird", "ferret", "reptile", "fish", "other"])
    .nullable()
    .optional(),
  breed: z.string().nullable().optional(),
  colorMarkings: z.string().nullable().optional(),
  collarId: z.string().nullable().optional(),
  lastSeen: z
    .object({
      address: z.string().nullable().optional(),
      locality: z.string().nullable().optional(),
      timeOfDay: z.string().nullable().optional(),
      freeText: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  assistantText: z.string().optional(),
});

type IntakeObject = z.infer<typeof lostPetIntakeSchema>;

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Empathy-first opening hook. Source of truth lives in locale JSON
 * (`chatIntake.greeting`); this sentinel is replaced on mount so the
 * rendered greeting always matches the active locale, even if the user
 * changes language before the component mounts.
 */
const OPENING_HOOK_SENTINEL = "__open_hook_placeholder__";

/* -------------------------------------------------------------------------- */
/* Field ordering & helpers                                                    */
/* -------------------------------------------------------------------------- */

type CaptureField =
  | "species"
  | "breed"
  | "colorMarkings"
  | "collarId"
  | "lastSeen";

const FIELD_ORDER: CaptureField[] = [
  "species",
  "breed",
  "colorMarkings",
  "collarId",
  "lastSeen",
];

function captureFromObject(acc: Partial<IntakeObject>): Record<CaptureField, string | undefined> {
  return {
    species: acc.species ?? undefined,
    breed: acc.breed ?? undefined,
    colorMarkings: acc.colorMarkings ?? undefined,
    collarId: acc.collarId ?? undefined,
    lastSeen: acc.lastSeen
      ? [
          acc.lastSeen.address,
          acc.lastSeen.locality,
          acc.lastSeen.timeOfDay,
          acc.lastSeen.freeText,
        ]
          .filter(Boolean)
          .join(" · ") || undefined
      : undefined,
  };
}

function fieldProgress(captured: Record<CaptureField, string | undefined>) {
  return FIELD_ORDER.filter((f) => {
    const v = captured[f];
    return v !== undefined && v !== null && String(v).trim().length > 0;
  }).length;
}

/**
 * Returns TRUE when every required field is captured. Used to gate the
 * activation CTA in the sidebar.
 */
function isFiveOfFive(captured: Record<CaptureField, string | undefined>): boolean {
  return fieldProgress(captured) === FIELD_ORDER.length;
}

function fieldLabel(field: CaptureField, t: (k: string) => string): string {
  switch (field) {
    case "species":
      return t("chatIntake.label_species");
    case "breed":
      return t("chatIntake.label_breed");
    case "colorMarkings":
      return t("chatIntake.label_color");
    case "collarId":
      return t("chatIntake.label_collar");
    case "lastSeen":
      return t("chatIntake.label_last_seen");
  }
}

const FIELD_PROMPTS: Record<
  CaptureField,
  { icon: typeof PawPrint; key: string }
> = {
  species: { icon: PawPrint, key: "chatIntake.sidebar_help_species" },
  breed: { icon: Tag, key: "chatIntake.sidebar_help_breed" },
  colorMarkings: { icon: Heart, key: "chatIntake.sidebar_help_color" },
  collarId: {
    icon: ShieldCheck,
    key: "chatIntake.sidebar_help_collar",
  },
  lastSeen: { icon: MapPin, key: "chatIntake.sidebar_help_last_seen" },
};

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export interface LostPetAgentProps {
  context?: {
    creditTxnId?: string;
    spendTxnId?: string;
    newBalance?: number;
  };
  onExit?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

let _msgCounter = 0;
function nextMsgId(): string {
  _msgCounter += 1;
  return `lpa-${_msgCounter}-${Date.now()}`;
}

export default function LostPetAgent({ context, onExit }: LostPetAgentProps) {
  const router = useRouter();

  /* ── Locale bootstrap + listener (matches FloatingChatbot pattern) ── */
  const [locale, setLocale] = useState<LocaleCode>("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocale(
        resolveStoredLocale(localStorage.getItem(LOCALE_STORAGE_KEY)),
      );
    } catch {
      /* default English */
    }
    const handler = () => {
      try {
        setLocale(
          resolveStoredLocale(localStorage.getItem(LOCALE_STORAGE_KEY)),
        );
      } catch {
        /* noop */
      }
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => trFor(locale, key, vars),
    [locale],
  );

  /* ── Chat transcript (local retention so history survives across turns) ─ */
  // The opening-hook sentinel is replaced with the translated greeting on
  // first mount + whenever the locale changes (so a live language switch
  // pre-conversation reflects immediately).
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "opening-hook", role: "assistant", content: OPENING_HOOK_SENTINEL },
  ]);
  const [input, setInput] = useState("");

  /* ── Accumulated object state across turns (hook returns ONE partial at a time) ─ */
  const [accumulated, setAccumulated] = useState<Partial<IntakeObject>>({});

  /* ── Latest live assistant message mid-stream (overlaps the hook's object.assistantText) ─ */
  const [liveAssistantText, setLiveAssistantText] = useState<string>("");

  /* ── Activation flow: 5/5 → "Activate Search Network" → POST + radar redirect ─ */
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Greeting resolution: replace the opening-hook sentinel with the   ─ */
  /*    translated greeting whenever the locale resolves or changes.     ─ */
  /*    Runs on every render-with-sentinel present (defensively).         ─ */
  useEffect(() => {
    const translated = t("chatIntake.greeting");
    setMessages((prev) =>
      prev.length === 1 &&
      prev[0]?.id === "opening-hook" &&
      prev[0]?.content !== translated
        ? [{ ...prev[0]!, content: translated }]
        : prev,
    );
  }, [t]);

  /* ── Bind to /api/chat-intake. Schema reference is required by the hook typedef. ─ */
  const { object, submit, isLoading, error, stop } = experimental_useObject({
    api: "/api/chat-intake",
    schema: lostPetIntakeSchema,
    credentials: "same-origin",
    onError: (e) => {
      console.error("[LostPetAgent] useObject error:", e);
    },
  });

  /* ── Live assistant text mirrors object.assistantText while streaming. ─ */
  useEffect(() => {
    const text = (object as Partial<IntakeObject> | undefined)?.assistantText;
    if (typeof text === "string") {
      setLiveAssistantText(text);
    }
  }, [object]);

  /* ── On stream finish (isLoading false && object populated): ─ */
  /*      - snapshot into accumulated                          ─ */
  /*      - promote latest live assistant text into transcript ─ */
  useEffect(() => {
    if (isLoading) return;
    if (!object) return;

    setAccumulated((prev) => ({ ...prev, ...(object as Partial<IntakeObject>) }));

    const assistantText = (object as Partial<IntakeObject>).assistantText;
    if (typeof assistantText === "string" && assistantText.trim().length > 0) {
      setMessages((prev) => {
        // Avoid double-appending if the assistant text matches the last
        // assistant message (re-render guard).
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === assistantText) {
          return prev;
        }
        if (last?.role === "assistant" && last.id !== "opening-hook") {
          // Replace the prior in-flight assistant message bubble with the
          // finalized content.
          return [
            ...prev.slice(0, -1),
            { id: nextMsgId(), role: "assistant", content: assistantText },
          ];
        }
        return [
          ...prev,
          { id: nextMsgId(), role: "assistant", content: assistantText },
        ];
      });
      setLiveAssistantText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  /* ── Catch the case where we go from "loading" to "no result" mid-cycle ─ */
  /*      (e.g. user clicked away); clear live text after fold. ─ */
  useEffect(() => {
    if (!isLoading && error && liveAssistantText.length > 0) {
      setLiveAssistantText("");
    }
  }, [isLoading, error, liveAssistantText.length]);

  /* ── Auto-scroll on transcript change. ─ */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveAssistantText, isLoading]);

  /* ── Sidebar capture ─ derived from accumulated; live streaming patches override ─ */
  const liveMerged: Partial<IntakeObject> = useMemo(
    () => ({ ...accumulated, ...(object as Partial<IntakeObject> | undefined) }),
    [accumulated, object]
  );
  const captured = captureFromObject(liveMerged);
  const completed = fieldProgress(captured);

  /* ── Submit handler ─ */
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        content: trimmed,
      };
      const transcript: ChatMessage[] = [...messages, userMsg];

      setMessages(transcript);
      setInput("");
      setLiveAssistantText("");

      // Build the AI SDK messages payload. The `locale` field tells the
      // /api/chat-intake route which language to converse in.
      const payload = {
        locale,
        messages: transcript.map((m) => ({ role: m.role, content: m.content })),
      };

      try {
        submit(payload);
      } catch (err) {
        // useObject throws synchronously on bad input (e.g. fetch setup).
        // Surface as a transient assistant bubble so the user knows.
        const msg = err instanceof Error ? err.message : "Unknown submit error";
        setMessages((prev) => [
          ...prev,
          {
            id: nextMsgId(),
            role: "assistant",
            content: `Sorry — the intake stream failed to start. (${msg})`,
          },
        ]);
      }
    },
    // The submit closure depends on `t`/`locale` for downstream call sites
    // that read from them. We accept the dependency churn — the closure
    // only re-binds on language switch, never mid-stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, messages, submit, locale]
  );

  /* ── Activation callback: persisted when all 5 fields are captured. ─ */
  const activateSearchNetwork = useCallback(async () => {
    if (isActivating) return;
    setIsActivating(true);
    setActivationError(null);

    // captured.lastSeen is already a flattened "address · locality · time ·
    // freeText" string from captureFromObject(); we send that to /api/searches.
    const body = {
      species: captured.species ?? "",
      breed: captured.breed ?? "",
      colorMarkings: captured.colorMarkings ?? "",
      collarId: captured.collarId ?? "",
      lastSeen: captured.lastSeen ?? "",
      debitTxnId: context?.spendTxnId,
    };

    try {
      const res = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok: boolean; search?: { searchId: string }; error?: string; message?: string }
        | null;
      if (!res.ok || !json?.search?.searchId) {
        const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`;
        setActivationError(`Could not activate search: ${msg}`);
        setIsActivating(false);
        return;
      }
      // Success — exit the chat into the radar payoff.
      router.push(`/radar/${json.search.searchId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown submit error";
      setActivationError(`Could not activate search: ${msg}`);
      setIsActivating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActivating, captured, context?.spendTxnId, router]);
  return (
    <div
      className="flex h-[calc(100vh-2rem)] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
      role="region"
      aria-label="Lost Pet intake conversation"
    >
      {/* ── Left: chat surface ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                RescueHub Assistant
              </h2>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Lost Pet Search · Live intake
              </p>
            </div>
          </div>
          {onExit && (
            <button
              type="button"
              onClick={() => {
                stop();
                onExit();
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && <StreamingBubble liveText={liveAssistantText} />}
            {error && (
              <div className="flex justify-start">
                <div className="inline-flex max-w-[85%] items-start gap-3 rounded-2xl rounded-bl-md border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm leading-relaxed">
                    {t("chatIntake.stream_unavailable_title", {
                      error: error.message,
                    })}
                  </p>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-white px-6 py-4"
        >
          <div className="flex items-end gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatIntake.input_placeholder")}
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
              aria-label="Message the assistant"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 active:scale-[0.95] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              aria-label={t("chatIntake.send_label")}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            {t("chatIntake.private_note")}
          </p>
        </form>
      </div>

      {/* ── Right: Intake progress sidebar ──────────────────────────────── */}
      <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-slate-50/60 lg:flex lg:flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {t("chatIntake.sidebar_title")}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(completed / FIELD_ORDER.length) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold tabular-nums text-slate-700">
              {completed}/{FIELD_ORDER.length}
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-3 overflow-y-auto p-5">
          {FIELD_ORDER.map((field) => {
            const value = captured[field];
            const isCaptured =
              value !== undefined && value !== null && String(value).trim().length > 0;
            const Icon = FIELD_PROMPTS[field].icon;
            return (
              <li
                key={field}
                className={`rounded-2xl border p-4 transition-colors ${
                  isCaptured
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isCaptured
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {fieldLabel(field, t)}
                  </p>
                </div>
                {isCaptured ? (
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {value}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {t(FIELD_PROMPTS[field].key)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {context?.newBalance !== undefined && (
          <div className="border-t border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <AlertCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                {t("chatIntake.wallet_balance_label")}{" "}
                <span className="font-semibold tabular-nums text-slate-900">
                  {context.newBalance.toLocaleString()}
                </span>{" "}
                {t("chatIntake.wallet_balance_unit")}
              </span>
            </div>
          </div>
        )}

        {/* ── Activation CTA — fades in when the intake hits 5/5 ──────── */}
        {isFiveOfFive(captured) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-5 py-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                {t("chatIntake.ready_to_broadcast")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void activateSearchNetwork()}
              disabled={isActivating}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-500 hover:via-emerald-500 hover:to-amber-400 hover:shadow-emerald-500/40 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full disabled:hidden"
              />
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("chatIntake.activating_label")}
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  {t("chatIntake.activate_button")}
                </>
              )}
            </button>
            {activationError && (
              <p className="mt-2 text-[11px] font-medium text-rose-600">
                {activationError}
              </p>
            )}
          </motion.div>
        )}
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                               */
/* -------------------------------------------------------------------------- */

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[85%] items-start gap-3">
        {!isUser && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow">
            <Heart className="h-3.5 w-3.5" />
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 leading-relaxed ${
            isUser
              ? "rounded-br-md bg-emerald-600 text-white"
              : "rounded-bl-md bg-slate-100 text-slate-900"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ liveText }: { liveText: string }) {
  const hasText = liveText.trim().length > 0;
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-400 text-white shadow">
          <Heart className="h-3.5 w-3.5" />
        </div>
        <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 leading-relaxed text-slate-900">
          {hasText ? (
            <p className="whitespace-pre-wrap text-sm">{liveText}</p>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
