"use client";

/**
 * /intake — the intake hub page.
 *
 * Three cards routing to /intake/public, /intake/medical, /intake/document-scan.
 *
 * i18n strategy mirrors the Sidebar / AnimalTable / AboutNav convention:
 *   - Static import of every locale dict
 *   - Resolve active locale from localStorage at mount, then re-render on locale
 *     change events from <LocaleSwitch />
 *   - SSR renders English (no localStorage available server-side).
 */
import Link from "next/link";
import { useState, useEffect } from "react";
import { ScanLine, Heart, Shield, ArrowRight } from "lucide-react";
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
  // Legacy "zh" kept on disk as byte-copy of zh-CN
  zh: zhLegacyDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

// Hardcoded English fallbacks during SSR (so children render meaningfully
// before hydration; after mount, locale JSON drives the strings).
const EN_FALLBACK: Record<string, string> = {
  "intake_hub.title": "Intake Operations",
  "intake_hub.subtitle":
    "Choose an intake path to begin processing an animal record.",
  "intake_hub.public_title": "Public Surrender Portal",
  "intake_hub.public_body":
    "ESIGN/UETA-compliant electronic waiver for citizens surrendering a pet or reporting a found stray. Creates a legally defensible chain of custody.",
  "intake_hub.public_cta": "Open Portal",
  "intake_hub.medical_title": "Staff Medical Intake",
  "intake_hub.medical_body":
    "ASPCA TPR (Temp/Pulse/Respiration) checksheet, emergency signs flags, medical history, and file linking for shelter staff.",
  "intake_hub.medical_cta": "Open Medical Intake",
  "intake_hub.ai_title": "AI Document Scan",
  "intake_hub.ai_body":
    "Staff-only: bulk-upload cage cards and intake sheets. Gemini vision extracts structured records (name, breed, age, medical, risk flags) directly into the intake pipeline.",
  "intake_hub.ai_cta": "Launch Document Scan",
};

function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN"; // legacy alias
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

function readKey(dict: Record<string, unknown>, key: string): string | null {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : null;
}

export default function IntakeHubPage() {
  const [locale, setLocale] = useState("en");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      // noop
    }
  }, []);

  // Re-render when locale changes anywhere else in the app
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
      } catch {
        // noop
      }
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const tr = (key: string): string => {
    if (typeof window === "undefined") {
      return EN_FALLBACK[key] ?? key;
    }
    const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS.en;
    return readKey(dict, key) ?? EN_FALLBACK[key] ?? key;
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {tr("intake_hub.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {tr("intake_hub.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Public Surrender Portal */}
        <Link
          href="/intake/public"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700">
            {tr("intake_hub.public_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.public_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-500">
            {tr("intake_hub.public_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 2: Staff Medical Intake */}
        <Link
          href="/intake/medical"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700">
            {tr("intake_hub.medical_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.medical_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-500">
            {tr("intake_hub.medical_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 3: Staff AI Document Scan */}
        <Link
          href="/intake/document-scan"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
            <ScanLine className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-700">
            {tr("intake_hub.ai_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.ai_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-rose-600 group-hover:text-rose-500">
            {tr("intake_hub.ai_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
