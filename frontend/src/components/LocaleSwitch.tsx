"use client";

import { useState, useEffect } from "react";
import { Languages, ChevronDown } from "lucide-react";

/**
 * Locale selector. Phase 6 i18n expansion: 6 locales total.
 *
 * Display order: English, Español, 简体中文, 繁體中文, 日本語, 한국어.
 * Order matches LOCALES in src/lib/i18n.ts except Chinese variants are
 * split out individually rather than the legacy single "zh" entry.
 */
const LOCALES: ReadonlyArray<{ code: string; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

const STORAGE_KEY = "rescuehub_locale";

function isValidLocale(value: string | null | undefined): value is string {
  return (
    value === "en" || value === "es" ||
    value === "zh-CN" || value === "zh-TW" ||
    value === "ja" || value === "ko"
  );
}

export function LocaleSwitch() {
  const [locale, setLocaleState] = useState("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Legacy alias: "zh" → "zh-CN" (Simplified Mandarin)
        if (stored === "zh") setLocaleState("zh-CN");
        else if (isValidLocale(stored)) setLocaleState(stored);
        else setLocaleState("en");
      } catch {
        setLocaleState("en");
      }
    }
  }, []);

  const handleSelect = (code: string) => {
    if (!isValidLocale(code)) return;
    setLocaleState(code);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, code);
        window.dispatchEvent(
          new CustomEvent("rescuehub-locale-change", { detail: code }),
        );
      } catch {}
    }
    setOpen(false);
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Select language"
      >
        <Languages className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{current.flag} {current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 ${
                  l.code === locale
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-600"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
