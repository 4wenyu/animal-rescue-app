"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FundraisingWallet } from "@/src/components/fundraising/FundraisingWallet";
import { ChevronLeft } from "lucide-react";

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
  "fundraising.back_to_list": "Back to Fundraising List",
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
 * Dynamic fundraising campaign page for a specific animal.
 *
 * Route: /fundraising/[animalId]
 *
 * Heuristic default goals:
 *   $1,500 for standard intake animals
 *   $5,000 for VET FLAGGED animals (animalId starting with "VET-")
 */
export default function FundraisingPage(): ReactNode {
  const params = useParams<{ animalId: string }>();
  const animalId = params.animalId;
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

  // Heuristic: VET- prefix = flagged animal with higher target
  const isVetFlagged = animalId.startsWith("VET-");
  const targetGoal = isVetFlagged ? 5000 : 1500;

  const handleDonate = (_data: {
    amount: number;
    allocation: "medical" | "general";
  }): void => {
    // Production: POST to /api/fundraising/donate
    // The payload maps to FundraisingWallet mutations:
    //   animalId: string, amount: number, restrictionType: FundType
    console.log("Donation payload:", JSON.stringify({ animalId, ..._data }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* ── Back button ──────────────────────────────────────── */}
      <div className="mb-4">
        <Link
          href="/fundraising"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {trFor(locale, "fundraising.back_to_list")}
        </Link>
      </div>
      <FundraisingWallet
        animalId={animalId}
        targetGoal={targetGoal}
        currentBalance={0}
        locale={locale}
      />
    </div>
  );
}
