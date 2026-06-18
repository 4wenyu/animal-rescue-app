"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
  if (stored === "zh") return "zh-CN";
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

const EN_FALLBACK: Record<string, string> = {
  "fundraising.title": "Fundraising Campaigns",
  "fundraising.subtitle":
    "Support the animals in our care. Every donation is tracked with legal restriction flags to prevent fund mixing.",
  "fundraising.back_to_dashboard": "← Back to Dashboard",
  "fundraising.percent_funded": "{pct}% funded",
  "fundraising.goal_reached": "✓ Goal reached",
  "fundraising.donate_cta": "Donate →",
  "fundraising.showing_count":
    "Showing {count} active campaigns. A full list will be available once the database is connected. All transactions comply with the Charleston Principles for internet-based charitable fundraising.",
};

function tr(locale: string, key: string, vars?: Record<string, string | number>): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) return EN_FALLBACK[key] ?? key;
    value = (value as Record<string, unknown>)[p];
  }
  if (typeof value !== "string") return EN_FALLBACK[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) =>
    str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)), value);
}

/** Placeholder data — replace with Prisma query in production. */
const RECENT_CAMPAIGNS = [
  { id: "DOG-A001", species: "Dog", goal: 1500, raised: 875 },
  { id: "CAT-B042", species: "Cat", goal: 1500, raised: 1500 },
  { id: "VET-D003", species: "Dog", goal: 5000, raised: 2100 },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents);
}

export default function FundraisingPage() {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* default English */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const t = (key: string, vars?: Record<string, string | number>) =>
    tr(locale, key, vars);

  return (
    <div className="space-y-6">
      {/* ── Header with back button ─────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("fundraising.title")}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {t("fundraising.subtitle")}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          {t("fundraising.back_to_dashboard")}
        </Link>
      </div>

      {/* ── Campaign cards ──────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RECENT_CAMPAIGNS.map((campaign) => {
          const progressPct = Math.min(
            (campaign.raised / campaign.goal) * 100,
            100,
          );
          const isComplete = campaign.raised >= campaign.goal;

          return (
            <Link
              key={campaign.id}
              href={`/fundraising/${campaign.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {campaign.id}
                  </h3>
                  <p className="text-xs text-slate-400">{campaign.species}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isComplete ? "text-emerald-600" : "text-slate-600"
                  }`}
                >
                  {formatCurrency(campaign.raised)} /{" "}
                  {formatCurrency(campaign.goal)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {t("fundraising.percent_funded", {
                    pct: Math.round(progressPct).toString(),
                  })}
                </span>
                {isComplete ? (
                  <span className="font-semibold text-emerald-600">
                    {t("fundraising.goal_reached")}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    {t("fundraising.donate_cta")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Footer note ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          {t("fundraising.showing_count", { count: RECENT_CAMPAIGNS.length })}
        </p>
      </div>
    </div>
  );
}
