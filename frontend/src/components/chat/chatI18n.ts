"use client";
import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Synchronous i18n: import locale JSONs statically — same pattern as
// Sidebar, AboutNav, and other client components. Locale defaults to "en",
// switches after hydration, and refreshes whenever the
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

export function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN"; // legacy alias
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

// English fallbacks used as a final safe value if a key is missing from
// the active locale's JSON.
const EN_FALLBACK: Record<string, string> = {
  "chatbot.title": "RescueHub Assistant",
  "chatbot.open_label": "Open chat",
  "chatbot.close_label": "Close chat",
  "chatbot.greeting":
    "Hello — I'm the RescueHub Assistant. I can help you find a missing pet, meet an animal who needs a home, start a surrender, or support a medical campaign. What brings you here today?",
  "chatbot.greeting_adopt":
    "Looking for a companion? Tell me about your home and I'll point you to an animal waiting here. I will not assume anyone is missing.",
  "chatbot.input_placeholder": "Type your response...",
  "chatbot.attach_label": "Attach file",
  "chatbot.send_label": "Send message",
  "chatbot.error": "Sorry, I encountered an error. Please try again. ({error})",
};

export function trFor(locale: string, key: string, vars?: Record<string, string>): string {
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

export type TranslateFn = (key: string, vars?: Record<string, string>) => string;

/** Locale bootstrap + `rescuehub-locale-change` listener for the chatbot. */
export function useChatLocale(): { locale: string; t: TranslateFn } {
  // The chatbot is mounted client-only via ChatbotMount (dynamic, ssr:false),
  // so the first render always runs in the browser and localStorage is
  // readable. Resolving lazily here produces the same value the old
  // post-mount bootstrap effect produced, without a setState-in-effect pass.
  const [locale, setLocale] = useState<string>(() => {
    try {
      return resolveLocale(localStorage.getItem(STORAGE_KEY));
    } catch {
      /* default English */
    }
    return "en";
  });

  useEffect(() => {
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

  const t = useCallback<TranslateFn>(
    (key, vars) => trFor(locale, key, vars),
    [locale],
  );

  return { locale, t };
}
