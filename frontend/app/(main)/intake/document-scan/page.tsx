"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BatchUpload } from "@/src/components/intake/BatchUpload";

import enDict from "../../../../locales/en.json";
import esDict from "../../../../locales/es.json";
import zhCNDict from "../../../../locales/zh-CN.json";
import zhTWDict from "../../../../locales/zh-TW.json";
import jaDict from "../../../../locales/ja.json";
import koDict from "../../../../locales/ko.json";
import zhLegacyDict from "../../../../locales/zh.json";

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
  if (stored === "zh") return "zh-CN";
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

const EN_FALLBACK: Record<string, string> = {
  "intake_hub.staff_only_badge": "Staff Only",
  "intake_hub.ai_title": "AI Document Scan",
  "nav.back_to_options": "Back to Intake Options",
};

function trFor(locale: string, key: string): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) return EN_FALLBACK[key] ?? key;
    value = (value as Record<string, unknown>)[p];
  }
  return typeof value === "string" ? value : EN_FALLBACK[key] ?? key;
}

/**
 * Staff-only intake workflow: bulk AI document scan.
 *
 * Mounts the drag-and-drop BatchUpload client component, which POSTs each
 * staged file to /api/shelter/intake/map. The route handler validates the
 * extraction against lib/schemas/intake.ts (Zod) and returns a flat array
 * of normalized intake records.
 *
 * The IntakeLegalBanner component hides the ESIGN/UEA notice on this path
 * because that disclaimer applies to citizen-facing consent flows, not
 * staff document processing.
 */
export default function DocumentScanPage() {
  const [locale, setLocale] = useState("en");

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

  const t = (key: string) => trFor(locale, key);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            {t("intake_hub.staff_only_badge")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {t("intake_hub.ai_doc_title")}
          </h1>
        </div>
        <Link
          href="/intake"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("nav.back_to_options")}
        </Link>
      </div>

      <BatchUpload locale={locale} />
    </div>
  );
}
