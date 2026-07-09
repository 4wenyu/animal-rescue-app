"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, MessageCircle, X, Send, Paperclip } from "lucide-react";

// ---------------------------------------------------------------------------
// Synchronous i18n: import locale JSONs statically — same pattern as
// Sidebar, AboutNav, and other client components. Locale defaults to "en"
// during SSR, switches after hydration, and refreshes whenever the
// `rescuehub-locale-change` event fires (i.e. user changes language in
// LocaleSwitch).
// ---------------------------------------------------------------------------

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
const STORAGE_KEY = "rescuehub_locale";

function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN"; // legacy alias
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

// English fallbacks used during SSR (so the chat window reads correctly
// before hydration) AND as a final safe value if a key is missing from
// the active locale's JSON.
const EN_FALLBACK: Record<string, string> = {
  "chatbot.title": "RescueHub Assistant",
  "chatbot.open_label": "Open chat",
  "chatbot.close_label": "Close chat",
  "chatbot.greeting":
    "Hello. I am the RescueHub Assistant. I understand you are looking for your pet, and I am here to help. Take a deep breath. To start, what is your pet's name?",
  "chatbot.input_placeholder": "Type your response...",
  "chatbot.attach_label": "Attach file",
  "chatbot.send_label": "Send message",
  "chatbot.error": "Sorry, I encountered an error. Please try again. ({error})",
};

function trFor(locale: string, key: string, vars?: Record<string, string>): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) return EN_FALLBACK[key] ?? key;
    value = (value as Record<string, unknown>)[p];
  }
  if (typeof value !== "string") return EN_FALLBACK[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    value,
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function nextId(): string {
  msgCounter += 1;
  return `msg-${msgCounter}-${Date.now()}`;
}

export default function FloatingChatbot() {
  /* ── Route suppression ──────────────────────────────────────────────
   * The /lost-pet-intake page renders a FULL-PAGE intake chat surface
   * (LostPetAgent). Mounting the global FloatingChatbot FAB AND its
   * chatbot panel on the same route is redundant — and worse, the
   * bottom-right fixed FAB at `fixed bottom-6 right-6 z-[9999]` is
   * sitting on top of the LostPetAgent's paperclip button at the
   * visible bottom-right of the form area. The FAB's onClick
   * (toggle chatbot open) intercepts every pointer event in that
   * region, which is why the paperclip button click has been
   * silently failing in the browser — the click is reaching the FAB
   * (z-[9999]) before it ever reaches our paperclip button (z-50).
   *
   * Suppress the entire component (FAB + chat panel) on the
   * /lost-pet-intake route. This is deterministic regardless of
   * viewport size or scroll position; the LostPetAgent surface on
   * that route is the dedicated intake UI, not a folio of the global
   * chatbot.                                                        ─ */
  const pathname = usePathname();
  if (pathname === "/lost-pet-intake") return null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locale, setLocale] = useState("en");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── Vision attachment for the FloatingChatbot FAB chat. Mirrors the ──
   * same flow we shipped in LostPetAgent.tsx: hidden <input type=file>,
   * 4-layer visibility stack, ref-driven click, mime + size allowlist,
   * dataURL staging, optional parts[] forwarding on submit.
   *                                                                ─ */
  const [pendingImage, setPendingImage] = useState<{
    dataUrl: string;
    mimeType: string;
    filename: string;
    sizeBytes: number;
  } | null>(null);
  const [imageInputError, setImageInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /** MIME allowlist + size cap. Same numbers as LostPetAgent: 5 MB and
   *  the canonical 5 image formats ai-sdk/google accepts. */
  const ALLOWED_IMAGE_MIME = new Set<string>([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ]);
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(reader.error ?? new Error("FileReader failed"));
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

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageInputError(null);
      const file = e.target.files?.[0];
      // Reset selection so the same file can be re-picked after a reject.
      e.target.value = "";
      if (!file) return;

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
        console.log("[FloatingChatbot] file selected", {
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
        const msg =
          err instanceof Error ? err.message : "Could not read the file";
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

  // Auto-clear stale images because the FAB chat is short-lived
  // conversational state; if the user closes the panel (via isOpen flip,
  // route change, or unmount), any staged file should not survive. This
  // makes the UX resilient — picking an image then closing the panel
  // won't retain a ghost image into the next session.
  useEffect(() => {
    if (!isOpen && pendingImage) {
      setPendingImage(null);
      setImageInputError(null);
    }
  }, [isOpen, pendingImage]);

  // ── Locale bootstrap + listener ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* default English */
    }
    const handler = () => {
      try {
        setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    return () =>
      window.removeEventListener(
        "rescuehub-locale-change",
        handler as EventListener,
      );
  }, []);

  // ── Translate helper available to the component ─────────────────────
  const t = useCallback(
    (key: string, vars?: Record<string, string>) => trFor(locale, key, vars),
    [locale],
  );

  // ── Initialize greeting for the *current* locale on first mount ──────
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 0
        ? [
            {
              id: "initial-greeting",
              role: "assistant",
              content: t("chatbot.greeting"),
            },
          ]
        : prev,
    );
    // We intentionally only seed once on mount per locale; further renders
    // will keep the existing transcript intact.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-translate greeting whenever locale changes (only if user has
  //    not yet sent any message — i.e. they only see the greeting). ────
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "initial-greeting") {
        return [{ ...prev[0]!, content: t("chatbot.greeting") }];
      }
      return prev;
    });
    // We deliberately re-run when locale OR t changes.
  }, [locale, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, stagedImage?: {
      dataUrl: string;
      mimeType: string;
      filename: string;
      sizeBytes: number;
    } | null) => {
      const userMsg: Message = { id: nextId(), role: "user", content: text };
      const assistantId = nextId();

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        // Build the messages[] payload. When a staged image is attached
        // the LAST user message is upgraded to AI SDK `parts[]` carrying
        // both a text part and an image part inline (DataURL + mediaType).
        // Earlier turns stay as plain strings — multipart history would
        // bloat every turn's payload under repeated photo exchanges.
        // Pattern mirrors LostPetAgent.handleSubmit byte-for-byte.
        const conversation = [...messages, userMsg];
        const messagesPayload = stagedImage
          ? [
              ...conversation
                .slice(0, -1)
                .map((m) => ({ role: m.role, content: m.content })),
              {
                role: "user" as const,
                content: [
                  { type: "text" as const, text },
                  {
                    type: "image" as const,
                    image: stagedImage.dataUrl,
                    mediaType: stagedImage.mimeType,
                  },
                ],
              },
            ]
          : conversation.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesPayload }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        // Insert the assistant message stub right away
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch (err) {
        console.error("🚨 Chat fetch error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: t("chatbot.error", {
              error: err instanceof Error ? err.message : "Unknown error",
            }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, t],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      // Empty-text guard: allow pure image submissions (image-only is
      // valid), but block if there's nothing to send at all. Mirrors the
      // guard we shipped in LostPetAgent.handleSubmit.
      if ((!text && !pendingImage) || isLoading) return;
      const staged = pendingImage;
      // Clear staged image synchronously before async work — even if the
      // request rejects, the UI shows a non-image-only state on retry.
      setPendingImage(null);
      setImageInputError(null);
      sendMessage(text, staged);
    },
    [input, isLoading, sendMessage, pendingImage],
  );

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] flex h-[30rem] w-96 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <span className="text-sm font-bold tracking-tight text-white">
              {t("chatbot.title")}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={t("chatbot.close_label")}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5 leading-relaxed text-slate-200">
                    <p className="text-sm whitespace-pre-wrap">
                      {t("chatbot.greeting")}
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-md bg-emerald-600 text-white"
                        : "rounded-bl-md bg-slate-800 text-slate-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-700 p-3">
            {/* Image preview chip — appears above the input row when
                the user has staged a file via the paperclip. */}
            {pendingImage && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-2.5 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingImage.dataUrl}
                  alt={pendingImage.filename}
                  className="h-7 w-7 shrink-0 rounded-md border border-slate-600 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-slate-200">
                    {pendingImage.filename}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(pendingImage.sizeBytes / 1024).toFixed(0)} KB · {pendingImage.mimeType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearPendingImage}
                  aria-label="Remove attached image"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-700 hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Image-input error chip — rendered when upload validation rejects. */}
            {imageInputError && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-rose-700/60 bg-rose-950/70 px-2.5 py-1.5 text-[11px] text-rose-200">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="flex-1 truncate">{imageInputError}</span>
                <button
                  type="button"
                  onClick={() => setImageInputError(null)}
                  aria-label="Dismiss image error"
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-rose-300 hover:bg-rose-900/40"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            )}

            {/* Hidden file input — driven by the paperclip. Painted into
                the DOM with a 4-layer visibility stack so the imperative
                .click() opens the OS picker reliably across browsers.
                Mirrors LostPetAgent's <input> rendering byte-for-byte. */}
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
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  // SYNCHRONOUS paperclip handler. Inline arrow guarantees
                  // the .click() lives inside the user-gesture handler
                  // reference, which clears the browser-gesture gate for
                  // <input type="file"> imperative activation.
                  if (process.env.NODE_ENV !== "production") {
                    console.log("[FloatingChatbot] Paperclip clicked", {
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
                        "[FloatingChatbot] paperclip click() threw:",
                        err,
                      );
                    }
                  }
                }}
                disabled={isLoading}
                aria-label={t("chatbot.attach_label")}
                className="relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-400 transition hover:border-emerald-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chatbot.input_placeholder")}
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                aria-label={t("chatbot.send_label")}
                disabled={(!input.trim() && !pendingImage) || isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t("chatbot.close_label") : t("chatbot.open_label")}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white drop-shadow-lg transition hover:bg-emerald-400 active:scale-95"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
