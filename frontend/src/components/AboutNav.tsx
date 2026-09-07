"use client";

/**
 * About dropdown — appears in both the public SiteHeader and the staff Sidebar.
 * Five routes under `/about/*` plus a top-level "About Us" summary entry.
 *
 * i18n strategy: the dropdown itself is a client component so strings swap the
 * moment locale changes (via the `rescuehub-locale-change` event).
 *
 * Locale awareness: each locale JSON provides `nav.about.{label,mission,legal,
 * process,story,about_us,contact}`. This component reads the current locale
 * through a tiny inline `t()` that mirrors the Sidebar pattern (so the import
 * graph stays sibling-side, no circular ref to src/lib/i18n.ts).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhCNDict from "../../locales/zh-CN.json";
import zhTWDict from "../../locales/zh-TW.json";
import jaDict from "../../locales/ja.json";
import koDict from "../../locales/ko.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

function getLocaleFromStorage(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Legacy alias: "zh" → "zh-CN" (Simplified Mandarin)
    if (stored === "zh") return "zh-CN";
    if (
      stored === "en" || stored === "es" || stored === "zh-CN" ||
      stored === "zh-TW" || stored === "ja" || stored === "ko"
    ) return stored;
  } catch {}
  return "en";
}

function t(key: string, locale: string): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS.en;
  const parts = key.split(".");
  let value: unknown = dict;
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

type AboutVariant = "sidebar" | "header";

interface AboutNavProps {
  /** "sidebar" (dark theme) or "header" (light theme). */
  variant?: AboutVariant;
}

const ABOUT_ROUTES = [
  { slug: "mission", labelKey: "nav.about.mission" },
  { slug: "process", labelKey: "nav.about.process" },
  { slug: "story", labelKey: "nav.about.story" },
  { slug: "team", labelKey: "nav.about.team" },
  { slug: "partners", labelKey: "nav.about.partners" },
  { slug: "faq", labelKey: "nav.about.faq" },
  { slug: "about-us", labelKey: "nav.about.about_us" },
  { slug: "privacy", labelKey: "nav.about.privacy" },
  { slug: "terms", labelKey: "nav.about.terms" },
  { slug: "careers", labelKey: "nav.about.careers" },
  { slug: "legal", labelKey: "nav.about.legal" },
  { slug: "contact", labelKey: "nav.about.contact" },
] as const;

export function AboutNav({ variant = "header" }: AboutNavProps) {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState("en");
  const [isMounted, setIsMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    setLocale(getLocaleFromStorage());
  }, []);

  // Re-render when locale changes anywhere else in the app
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setLocale(getLocaleFromStorage());
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Close on Escape + outside-click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Close the dropdown when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const activeLocale = isMounted ? locale : "en";
  const dropdownLabel = t("nav.about.label", activeLocale);
  const isActive = pathname?.startsWith("/about");

  // Theme tokens
  const isDark = variant === "sidebar";
  const triggerBase =
    "flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200";
  const triggerIdle = isDark
    ? "text-slate-400 hover:bg-white/5 hover:text-white"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const triggerActive = isDark
    ? "bg-white/10 font-semibold text-white shadow-inner shadow-white/5"
    : "bg-slate-100 font-semibold text-slate-900";
  const menuWrap =
    "absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-xl border bg-white shadow-lg shadow-slate-900/10";
  const menuBorder = isDark ? "border-white/10" : "border-slate-200";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${triggerBase} ${isActive || open ? triggerActive : triggerIdle}`}
      >
        <span>{dropdownLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={dropdownLabel}
          className={`${menuWrap} ${menuBorder}`}
        >
          {ABOUT_ROUTES.map(({ slug, labelKey }) => {
            const href = `/about/${slug}`;
            const isCurrent = pathname === href;
            return (
              <Link
                key={slug}
                href={href}
                role="menuitem"
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  isCurrent
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700"
                }`}
              >
                <span>{t(labelKey, activeLocale)}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${isCurrent ? "text-emerald-600" : "text-slate-400"}`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AboutNav;
