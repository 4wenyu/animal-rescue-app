"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  MedicalIntakeChecksheet,
  type MedicalFormData,
} from "@/src/components/medical/MedicalIntakeChecksheet";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";

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
  "medical.back_to_list": "Back to Medical Records",
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
 * Dynamic medical exam page for a specific animal.
 *
 * Route: /medical/[animalId]
 *
 * The `animalId` is extracted from the URL params. The checksheet
 * collects TPR, weight, microchip status, vaccines, dewormer,
 * topical treatments, and emergency triage signs — all mapping to
 * the Prisma MedicalLog model.
 */
export default function MedicalExamPage(): ReactNode {
  const params = useParams();
  const animalId = params.animalId as string;
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* default */
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
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
  }, []);

  // Heuristic species hint — replace with DB lookup in production.
  const speciesHint = animalId.startsWith("CAT-") ? "Cat" : "Dog";

  const handleSave = (data: MedicalFormData): void => {
    // Production: POST to /api/medical/log
    // The payload maps 1:1 to the Prisma MedicalLog model:
    //   weightLbs (Float?), tempPulseResp (Json), microchipScanned (Boolean),
    //   vaccinesAdministered (Json), dewormerAdministered (Json),
    //   emergencySignsNoted (Json)
    console.log("Medical intake payload:", JSON.stringify(data));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Bar with back button ──────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/medical"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {trFor(locale, "medical.back_to_list")}
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition">
            <PawPrint className="h-4 w-4" />
            <span>RescueHub</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <MedicalIntakeChecksheet
            animalId={animalId}
            species={speciesHint}
            locale={locale}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}
