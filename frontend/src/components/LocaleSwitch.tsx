"use client";

import { useState, useEffect } from "react";
import { Languages, ChevronDown } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
};

const LOCALE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  zh: "🇨🇳",
};

const STORAGE_KEY = "rescuehub_locale";

export function LocaleSwitch() {
  const [locale, setLocaleState] = useState("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "es" || stored === "zh") setLocaleState(stored);
        else setLocaleState("en");
      } catch {
        setLocaleState("en");
      }
    }
  }, []);

  const handleSelect = (l: string) => {
    const code = l === "es" || l === "zh" ? l : "en";
    setLocaleState(code);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, code);
        // Dispatch a custom event so the public page's useI18n hook picks up the change
        window.dispatchEvent(new CustomEvent("rescuehub-locale-change", { detail: code }));
      } catch {}
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Select language"
      >
        <Languages className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{LOCALE_FLAGS[locale]} {LOCALE_LABELS[locale]}</span>
        <span className="sm:hidden">{LOCALE_FLAGS[locale]}</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {Object.keys(LOCALE_LABELS).map((l) => (
              <button
                key={l}
                onClick={() => handleSelect(l)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 ${
                  l === locale
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-600"
                }`}
              >
                <span>{LOCALE_FLAGS[l]}</span>
                <span>{LOCALE_LABELS[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}