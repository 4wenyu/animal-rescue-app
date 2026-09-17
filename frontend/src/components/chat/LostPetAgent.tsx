"use client";
import { t as translate } from "@/src/lib/useI18n";

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
  Paperclip,
  PawPrint,
  Rocket,
  Send,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivateSearchConfirm } from "./ActivateSearchConfirm";
import { OPENING_HOOK_SENTINEL } from "./lostPetDraft";
import { useLostPetDraft } from "./useLostPetDraft";
import { writeLocaleCookie } from "@/src/lib/localeCode";

// Locale strings resolve through the shared src/lib/useI18n module
// (`translate(locale, key)`); this component keeps its own storage key and
// event name only for the subscription effect below.
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

/** Empathy-first opening hook — locale JSON is the source of truth. */

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
 * Sprint B — relaxed "not sure / skip" gate.
 *
 * Previously activation required 5/5 captured fields (including collarId),
 * which contradicted the system prompt's "never pressure" promise and
 * could strand an owner with no collar/microchip/breed. Now the MINIMUM
 * to start searching is species + lastSeen; breed / color / collar are
 * optional ("not sure" / "skip" is fine) and stored as null.
 */
function canActivate(captured: Record<CaptureField, string | undefined>): boolean {
  const species = captured.species;
  const lastSeen = captured.lastSeen;
  return (
    species !== undefined &&
    species !== null &&
    String(species).trim().length > 0 &&
    lastSeen !== undefined &&
    lastSeen !== null &&
    String(lastSeen).trim().length > 0
  );
}

/** Fields that are nice-to-have but NOT required to start a search. */
const OPTIONAL_FIELDS: ReadonlySet<CaptureField> = new Set([
  "breed",
  "colorMarkings",
  "collarId",
]);

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
      const resolved = resolveStoredLocale(
        localStorage.getItem(LOCALE_STORAGE_KEY),
      );
      setLocale(resolved);
      writeLocaleCookie(resolved);
    } catch {
      /* default English */
    }
    const handler = () => {
      try {
        const resolved = resolveStoredLocale(
          localStorage.getItem(LOCALE_STORAGE_KEY),
        );
        setLocale(resolved);
        writeLocaleCookie(resolved);
      } catch {
        /* noop */
      }
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(locale, key, vars),
    [locale],
  );

  /* ── Chat transcript (local retention so history survives across turns) ─ */
  // The opening-hook sentinel is replaced with the translated greeting on
  // first mount + whenever the locale changes (so a live language switch
  // pre-conversation reflects immediately).
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "opening-hook",
      role: "assistant",
      content: translate("en", "chatIntake.greeting"),
    },
  ]);
  const [input, setInput] = useState("");

  /* ── Accumulated object state across turns (hook returns ONE partial at a time) ─ */
  const [accumulated, setAccumulated] = useState<Partial<IntakeObject>>({});

  /* ── Latest live assistant message mid-stream (overlaps the hook's object.assistantText) ─ */
  const [liveAssistantText, setLiveAssistantText] = useState<string>("");

  /* ── Activation flow: species + lastSeen → "Activate Search Network" → POST + radar redirect ─ */
  const [isActivating, setIsActivating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  /** TRUE when activation failed because the visitor is not signed in. */
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const { restored: draftRestored, clear: clearDraft } = useLostPetDraft({
    messages,
    accumulated: accumulated as Record<string, unknown>,
    setMessages,
    setAccumulated: setAccumulated as (next: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void,
  });

  /* ── Vision attachment for the intake flow. If the user attaches a photo,
        we read it as a base64 data URL on submit and forward it to Gemini
        as an ImagePart alongside the text prompt. No upload to our own
        blob store — Gemini sees the bytes inline as multimodal context.
        Size + mime-type caps enforced here so the wire-side validator and
        the schema-side validator stay minimal. ─ */
  const [pendingImage, setPendingImage] = useState<{
    dataUrl: string;
    mimeType: string;
    filename: string;
    sizeBytes: number;
  } | null>(null);
  const [imageInputError, setImageInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * MIME allowlist + size cap for intake images. Wired to mirror what
   * the AI SDK `InputFile | InputImage` providers can ingest — anything
   * outside this allowlist gets rejected client-side with a transient
   * toast, never reaches the wire. 5 MB cap matches the typical
   * "phone photo" upper bound without covering 4K scan dumps.
   */
  const ALLOWED_IMAGE_MIME = new Set<string>([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ]);
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("FileReader returned a non-string result"));
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * The paperclip imperative-click uses a synchronous INLINE closure in
   * the JSX (rather than this useCallback-shaped sibling) on purpose.
   *
   * Rationale: some browsers gate `input[type=file]` programmatic `.click()`
   * on whether the call lives inside a synchronous user-gesture handler
   * reference (a strict ancestor of the user's click in the event chain).
   * `useCallback` returns a stable reference that may be invoked slightly
   * downstream of the native click event in React's synthetic event
   * dispatch loop; an inline arrow at the JSX site is unambiguously a
   * synchronous user-gesture closure and clears that gate on every browser.
   *
   * The diagnostic keep-here-in-handler is folded into the JSX site so the
   * log + `.click()` invariant always travel together.
   */

  /**
   * File-selected handler. Bound to the hidden <input type="file">'s
   * `onChange`. Validates against the mime allowlist + the 5 MB byte cap,
   * reads the file as a data URL via FileReader, and stages the result in
   * `pendingImage` for the next submit. Resets the input value so the
   * same file can be re-selected after a rejection.
   */
  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageInputError(null);
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset the input so the same file can be re-selected after a reject.
      e.target.value = "";

      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        setImageInputError(
          `Unsupported file type (${file.type || "unknown"}). Allowed: png, jpg, webp, gif.`,
        );
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        setImageInputError(
          `Image is too large (${mb} MB). Max is 5 MB — try a smaller photo.`,
        );
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[LostPetAgent] file selected", {
          name: file.name,
          mime: file.type,
          bytes: file.size,
        });
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingImage({
          dataUrl,
          mimeType: file.type,
          filename: file.name,
          sizeBytes: file.size,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not read the file";
        setImageInputError(`Could not attach the image: ${msg}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clearPendingImage = useCallback(() => {
    setPendingImage(null);
    setImageInputError(null);
  }, []);

  /* ── Greeting resolution: replace the opening-hook sentinel with the   ─ */
  /*    translated greeting whenever the locale resolves or changes.     ─ */
  /*    Runs on every render-with-sentinel present (defensively).         ─ */
  useEffect(() => {
    const translated = t("chatIntake.greeting");
    setMessages((prev) => {
      const first = prev[0];
      if (first?.id !== "opening-hook") return prev;
      const shouldReplace =
        first.content === OPENING_HOOK_SENTINEL || prev.length === 1;
      if (!shouldReplace || first.content === translated) return prev;
      return [{ ...first, content: translated }, ...prev.slice(1)];
    });
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

  /* ── Submit handler ── Bound to /api/chat-intake. Schema reference ── */
  /*    is required by the hook typedef (it passes the schema through to   */
  /*    validate the streamed object).                                     */
  /*                                                                       */
  /*    Last user message is shipped as AI-SDK `parts[]` when a pending   */
  /*    image is staged — it's converted from the locally-cached dataURL   */
  /*    into the AI SDK's image-part shape, alongside the text part.       */
  /*    Earlier turns stay as plain `{role,content:string}` because       */
  /*    multipart history bloat is wasteful; only the most recent upload  */
  /*    matters to Gemini's intake assistant for THIS turn.               */
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if ((!trimmed && !pendingImage) || isLoading) return;

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: "user",
        // Bubble copy shows the text portion only; the image is rendered
        // as a chip beneath the bubble at render time.
        content: trimmed,
      };
      const transcript: ChatMessage[] = [...messages, userMsg];

      setMessages(transcript);
      setInput("");
      setLiveAssistantText("");
      const stagedImage = pendingImage;
      setPendingImage(null);

      // Build the AI SDK messages payload. The `locale` field tells the
      // /api/chat-intake route which language to converse in. If a staged
      // image is attached, the LAST user message is upgraded to a parts
      // array — `{type:'text', text} + {type:'image', image: dataUrl,
      // mediaType}` — matching the AI SDK's UserContent array contract.
      const baseMessages = transcript.map((m) => ({
        role: m.role,
        content: m.content,
      })) as Array<{ role: "user" | "assistant" | "system"; content: string }>;
      const messagesPayload = stagedImage
        ? [
            ...baseMessages.slice(0, -1),
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: trimmed },
                {
                  type: "image" as const,
                  image: stagedImage.dataUrl,
                  mediaType: stagedImage.mimeType,
                },
              ],
            },
          ]
        : baseMessages;

      const payload = {
        locale,
        messages: messagesPayload,
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
    [input, isLoading, messages, submit, locale, pendingImage]
  );

  /* ── Activation callback: persisted when species + lastSeen are captured. ─ */
  const activateSearchNetwork = useCallback(async () => {
    if (isActivating) return;
    setIsActivating(true);
    setActivationError(null);
    setNeedsSignIn(false);

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
        // A public visitor with no session gets 401 — prompt to sign in
        // (create a free account) so they can activate their search.
        if (res.status === 401) {
          setNeedsSignIn(true);
          setIsActivating(false);
          return;
        }
        const msg = json?.message ?? json?.error ?? `HTTP ${res.status}`;
        setActivationError(`Could not activate search: ${msg}`);
        setIsActivating(false);
        return;
      }
      // Success — drop the local draft so a later visit starts clean.
      clearDraft();
      router.push(`/radar/${json.search.searchId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown submit error";
      setActivationError(`Could not activate search: ${msg}`);
      setIsActivating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActivating, captured, context?.spendTxnId, router, clearDraft]);
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
          {draftRestored && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
            >
              {t("chatIntake.draft_restored")}
            </p>
          )}
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
          {/* ── Image preview chip — appears directly above the input row when
              a pending image is staged. Click ✕ to remove BEFORE sending. ─ */}
          {pendingImage && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.dataUrl}
                alt={pendingImage.filename}
                className="h-12 w-12 shrink-0 rounded-lg border border-emerald-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-emerald-900">
                  {pendingImage.filename}
                </p>
                <p className="text-[10px] font-medium text-emerald-700">
                  {(pendingImage.sizeBytes / 1024).toFixed(0)} KB · {pendingImage.mimeType}
                </p>
              </div>
              <button
                type="button"
                onClick={clearPendingImage}
                aria-label="Remove attached image"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 hover:text-emerald-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* ── Inline error chip — appears when an uploaded file is rejected. ─ */}
          {imageInputError && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{imageInputError}</span>
              <button
                type="button"
                onClick={() => setImageInputError(null)}
                aria-label="Dismiss image error"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-rose-700 hover:bg-rose-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Hidden file input — driven by the paperclip button.
              ──────────────────────────────────────────────────────
              Defensive visibility strategy (multiple layers, all
              cumulative; none of them is the textbook solution on its
              own):

              (a) `className="absolute w-[1px] h-[1px]..."` positions the
                  input at 1 pixel with `overflow:hidden clip:rect(0,0,0,0)`
                  so it cannot be seen even if zoomed into the page.

              (b) `opacity-0` removes any rendering artifacts but keeps
                  the input painted into the layout tree (display: none
                  does NOT paint — for some browsers/some configurations
                  that distinction matters for programmatic click()).

              (c) `pointer-events-none` ensures the input itself can
                  never intercept clicks meant for the visible button
                  below it; the paperclip's own button is the interaction
                  surface.

              (d) `aria-hidden="true"` + `tabIndex={-1}` removes it from
                  the accessibility tree AND tab order; the visible
                  paperclip button is the canonical a11y entry point.

              All four together give the strongest cross-browser guarantee
              that the input (1) exists in the DOM, (2) is invisible but
              clickable by JS, (3) cannot interfere with click events on
              the paperclip button.

              accept="image/png,image/jpeg,image/webp,image/gif" mirrors
              the JS allowlist re-check downstream. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileSelected}
            className="pointer-events-none absolute h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0 opacity-0"
            style={{ clip: "rect(0, 0, 0, 0)", clipPath: "inset(50%)" }}
            aria-hidden="true"
            tabIndex={-1}
          />
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
              type="button"
              onClick={() => {
                // SYNCHRONOUS paperclip handler — runs directly inside the
                // user's click event, no useCallback closure capture, no
                // scheduling. Some browsers gate programmatic
                // <input type="file">.click() on whether the call lives
                // synchronously inside the user-gesture handler
                // reference; an inline arrow at the JSX site is the
                // strict synchronous ancestor of the click event in
                // every browser, which clears the user-gesture gate.
                //
                // The try/catch is redundant for HTMLInputElement.click()
                // (the spec does not define it to throw on activation
                // failure — silent no-op is the spec'd behavior), but it
                // costs nothing and surfaces genuine JS exceptions
                // raised upstream (e.g., the ref-resolve throwing under
                // a polyfilled environment).
                if (process.env.NODE_ENV !== "production") {
                  console.log("[LostPetAgent] Paperclip clicked", {
                    refAttached: fileInputRef.current !== null,
                    refType:
                      fileInputRef.current?.constructor?.name ?? null,
                  });
                }
                try {
                  fileInputRef.current?.click();
                } catch (err) {
                  if (process.env.NODE_ENV !== "production") {
                    console.error(
                      "[LostPetAgent] paperclip click() threw:",
                      err,
                    );
                  }
                }
              }}
              disabled={isLoading}
              aria-label="Attach an image"
              // relative + z-50: cheap insurance against any future
              // sibling absolute positioning overlap on the input row.
              // cursor-pointer: explicit so the button is unambiguously
              // an interactive target even before hover state fires.
              className="relative z-50 inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={(!input.trim() && !pendingImage) || isLoading}
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

        {/* ── Mobile activation bar — sticky bottom, below lg ──────────────
            The right-hand intake sidebar is hidden on small screens
            (`hidden lg:flex`), which previously made the Activate CTA
            unreachable on mobile. This bar mirrors the sidebar CTA for
            phones/tablets: progress + Activate once species + lastSeen
            are captured. */}
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          {canActivate(captured) ? (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isActivating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-500 hover:via-emerald-500 hover:to-amber-400 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70"
            >
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
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (fieldProgress(captured) / 2) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                {t("chatIntake.mobile_progress", {
                  count: String(
                    Math.min(2, fieldProgress(captured)),
                  ),
                })}
              </span>
            </div>
          )}
          {activationError && (
            <p className="mt-2 text-[11px] font-medium text-rose-600">
              {activationError}
            </p>
          )}
        </div>
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
                    {OPTIONAL_FIELDS.has(field) && (
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-400">
                        · {t("chatIntake.optional_badge")}
                      </span>
                    )}
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

        {/* ── Activation CTA — fades in when species + lastSeen are captured ─ */}
        {canActivate(captured) && (
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
              onClick={() => setConfirmOpen(true)}
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
            {needsSignIn && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {t("chatIntake.signin_title")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {t("chatIntake.signin_body")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/register?callbackUrl=${encodeURIComponent(
                      "/lost-pet-intake",
                    )}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                  >
                    {t("chatIntake.signin_create")}
                  </Link>
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      "/lost-pet-intake",
                    )}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("chatIntake.signin_login")}
                  </Link>
                </div>
              </div>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              {t("chatIntake.not_sure_note")}
            </p>
          </motion.div>
        )}
      </aside>
      <ActivateSearchConfirm
        open={confirmOpen}
        fields={FIELD_ORDER.map((field) => ({
          label: fieldLabel(field, t),
          value: captured[field],
        }))}
        fee={100}
        activating={isActivating}
        onConfirm={() => void activateSearchNetwork()}
        onClose={() => setConfirmOpen(false)}
        t={t}
      />
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
