"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, HeartPulse, PawPrint, ShieldCheck, Activity } from "lucide-react";

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
  "medical.back_to_dashboard": "Back to Dashboard",
  "medical.title": "Medical Records",
  "medical.subtitle":
    "Select an animal to view or update its ASPCA/CART-aligned medical intake examination.",
  "medical.species_intaken": "{species} · intaken {date}",
  "medical.view_examination": "View examination",
  "medical.compliance_esign": "ESIGN/UETA Compliant",
  "medical.compliance_aspca": "ASPCA/CART Exam Aligned",
  "medical.compliance_irs": "IRS § 501(c)(3)",
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
const RECENT_ANIMALS = [
  { id: "DOG-A001", species: "Dog", intakeDate: "2026-06-08" },
  { id: "CAT-B042", species: "Cat", intakeDate: "2026-06-09" },
  { id: "DOG-C109", species: "Dog", intakeDate: "2026-06-10" },
];

export default function MedicalRecordsPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Premium Header ──────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("medical.back_to_dashboard")}
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition">
            <PawPrint className="h-4 w-4" />
            <span>RescueHub</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* ── Header ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <HeartPulse className="h-4 w-4 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("medical.title")}
            </h1>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {t("medical.subtitle")}
          </p>
        </div>

        {/* ── Animal Cards ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECENT_ANIMALS.map((animal) => (
            <Link
              key={animal.id}
              href={`/medical/${animal.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition group-hover:bg-rose-100">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-rose-700 transition">
                    {animal.id}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {t("medical.species_intaken", {
                      species: animal.species,
                      date: animal.intakeDate,
                    })}
                  </span>
                </div>
              </div>
              {/* Action hint */}
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition group-hover:text-rose-600">
                {t("medical.view_examination")} <ArrowLeft className="h-3 w-3 rotate-180" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Compliance badge ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {t("medical.compliance_esign")}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            {t("medical.compliance_aspca")}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1">
            {t("medical.compliance_irs")}
          </span>
        </div>
      </div>
    </div>
  );
}
