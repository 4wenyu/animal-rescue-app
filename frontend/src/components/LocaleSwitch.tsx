"use client";

import { useRef, useState } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

/**
 * Locale selector. Phase 6 i18n expansion: 6 locales total.
 *
 * Display order: English, Español, 简体中文, 繁體中文, 日本語, 한국어.
 *
 * The selected locale lives in the shared `useI18n` store (localStorage
 * "rescuehub_locale" + the "rescuehub-locale-change" event), so this switch,
 * the home islands, and every hook consumer stay in sync — and `<html lang>`
 * updates to the active BCP-47 tag. A11y: aria-expanded/aria-haspopup
 * trigger, Escape closes and restores focus, visible focus rings.
 */
const LOCALES: ReadonlyArray<{ code: string; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The hook's locale is always a valid LocaleCode (it already resolves the
  // legacy "zh" alias to "zh-CN"), so this lookup cannot miss.
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const handleSelect = (code: string) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                aria-pressed={l.code === locale}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none ${
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
