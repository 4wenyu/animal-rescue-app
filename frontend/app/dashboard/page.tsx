"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  PawPrint,
  HeartPulse,
  Dog,
  Stethoscope,
  Calendar,
  ShieldCheck,
  Syringe,
  Activity,
  Users,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  Search,
} from "lucide-react";
import dogs from "../../data/dogs.json";
import { PremiumStatCard } from "@/src/components/dashboard/PremiumStatCard";
import { AnimalTable } from "@/src/components/dashboard/AnimalTable";
import { MySearches } from "@/src/components/dashboard/MySearches";
import { UbitSponsorWidget, EsignStatsWidget } from "@/src/components/dashboard/widgets";
import { TokenWalletCardClient } from "@/src/components/dashboard/TokenWalletCard.client";
import {
  SponsorshipCheckoutModal,
  type SearchGrantSuccess,
} from "@/src/components/dashboard/SponsorshipCheckoutModal";
import { SignOutButton } from "@/src/components/auth/SignOutButton";

// ── Synchronous i18n ─────────────────────────────────────────────────────
import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhDict from "../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  zh: zhDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

type LocaleCode = "en" | "es" | "zh";

function t(locale: string, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let value: unknown = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }, value);
}

function useI18n() {
  const [locale, setLocaleState] = useState<LocaleCode>("en");

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: CustomEvent) => {
      const l = e.detail as LocaleCode;
      if (l === "es" || l === "zh" || l === "en") setLocaleState(l);
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    return () => window.removeEventListener("rescuehub-locale-change", handler as EventListener);
  }, []);

  const setLocale = useCallback((l: string) => {
    const code = (l === "es" || l === "zh" ? l : "en") as LocaleCode;
    setLocaleState(code);
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, code); } catch {}
    }
  }, []);

  const tr = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale]
  );

  return { locale, tr, setLocale };
}

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const { tr, locale } = useI18n();

  // Fetch the current token balance so the sponsor-gateway modal can
  // pre-flight the Insufficient Funds check (balance + 50 must cover 100).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tokens/wallet", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.wallet) setWalletBalance(j.wallet.cachedBalance);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchGranted = useCallback(
    (result: SearchGrantSuccess) => {
      // Refresh the wallet card to reflect the +50 / -100 ledger rows.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tokenwallet:refresh"));
      }
      router.push(
        `/lost-pet-intake?credit=${encodeURIComponent(result.creditTxnId)}` +
          `&spend=${encodeURIComponent(result.spendTxnId)}` +
          `&newBalance=${encodeURIComponent(String(result.newBalance))}`,
      );
    },
    [router],
  );

  const dogsTyped = dogs as Dog[];
  const totalDogs = dogsTyped.length;
  const healthyCount = dogsTyped.filter((d) => d.medicalStatus === "Healthy").length;
  const needsReviewCount = dogsTyped.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = (dogsTyped.reduce((s, d) => s + d.age, 0) / totalDogs).toFixed(1);

  // Honest stat meta (review §4.2 #174/#175): no invented baselines (248/48),
  // no hardcoded numerators (271/342). Each card states only what the 12-animal
  // roster actually is. Trend badges are omitted entirely — there is no real
  // historical snapshot to compute them from.

  const filteredDogs = useMemo(() => {
    if (!filter) return dogsTyped;
    if (filter === "Needs Review") {
      return dogsTyped.filter((d) => d.medicalStatus === "Needs Review");
    }
    if (filter === "Healthy") {
      return dogsTyped.filter((d) => d.medicalStatus === "Healthy");
    }
    if (filter === "Total Dogs") {
      return dogsTyped;
    }
    return dogsTyped;
  }, [filter, dogsTyped]);

  const stats = [
    {
      label: tr("dashboard.stats.total_dogs"),
      value: totalDogs,
      icon: PawPrint,
      accentColor: "#533afd",
      meta: tr("dashboard.stats.of_total", { count: totalDogs }),
      filterKey: "Total Dogs",
    },
    {
      label: tr("dashboard.stats.healthy"),
      value: healthyCount,
      icon: HeartPulse,
      accentColor: "#15be53",
      meta: tr("dashboard.stats.of_total", { count: totalDogs }),
      filterKey: "Healthy",
    },
    {
      label: tr("dashboard.stats.needs_review"),
      value: needsReviewCount,
      icon: AlertTriangle,
      accentColor: "#ea2261",
      meta: tr("dashboard.stats.of_total", { count: totalDogs }),
      filterKey: "Needs Review",
    },
    {
      label: tr("dashboard.stats.avg_age"),
      value: `${avgAge} ${tr("dashboard.stats.yrs")}`,
      icon: Users,
      accentColor: "#533afd",
      meta: tr("dashboard.stats.across_all"),
      filterKey: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Header ───────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 pt-0"
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {tr("dashboard.title")}
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <PawPrint className="h-3.5 w-3.5 text-slate-400" />
                {tr("dashboard.active_roster", { count: totalDogs })}
              </span>
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  <ShieldCheck className="h-3 w-3" />
                  {tr("dashboard.clear_filter", { filter })}
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SignOutButton className="mr-1" />
            <button
              type="button"
              onClick={() => setSponsorModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-100 active:scale-[0.97]"
            >
              <Search className="h-4 w-4" />
              {tr("dashboard.find_my_pet")}
            </button>
            <Link
              href="/intake/public"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 active:scale-[0.97]"
            >
              <PawPrint className="h-4 w-4" />
              {tr("dashboard.add_animal")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.header>

      <section className="mb-8"><TokenWalletCardClient/></section>

      {/* ── Stat Cards — clickable to filter the table ──────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            onClick={() => {
              if (stat.filterKey === "Total Dogs" || stat.filterKey === null) {
                setFilter(null);
              } else {
                setFilter(stat.filterKey === filter ? null : stat.filterKey);
              }
            }}
            className={stat.filterKey ? "cursor-pointer" : ""}
            title={stat.filterKey ? tr("dashboard.stats.filter_healthy") : undefined}
          >
            <PremiumStatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              accentColor={stat.accentColor}
              totalDogs={totalDogs}
              meta={stat.meta}
              delay={i * 0.07}
            />
          </div>
        ))}
      </div>

      {/* ── Phase 5 Compliance Widgets — side by side ────────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UbitSponsorWidget />
        <EsignStatsWidget />
      </div>

      {/* ── My lost-pet searches — status timeline (Sprint A) ── */}
      <div className="mb-8">
        <MySearches />
      </div>

      {/* ── Triage Table ────────────────────────────────────── */}
      <AnimalTable dogs={filteredDogs} onViewAll={() => setFilter(null)} />

      {/* ── Footer ──────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 pb-8 text-center text-xs text-slate-400"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          {tr("dashboard.v3")}
        </span>
      </motion.p>

      {/* ── Epic 2 sponsor-gateway modal (gates the Lost Pet Search) ── */}
      <SponsorshipCheckoutModal
        open={sponsorModalOpen}
        currentBalance={walletBalance}
        onClose={() => setSponsorModalOpen(false)}
        onSearchGranted={handleSearchGranted}
      />
    </div>
  );
}