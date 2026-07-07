"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Paperclip } from "lucide-react";

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
    async (text: string) => {
      const userMsg: Message = { id: nextId(), role: "user", content: text };
      const assistantId = nextId();

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const conversation = [...messages, userMsg];

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversation }),
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
      if (!text || isLoading) return;
      sendMessage(text);
    },
    [input, isLoading, sendMessage],
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
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t("chatbot.attach_label")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:text-white"
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
                disabled={!input.trim() || isLoading}
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
