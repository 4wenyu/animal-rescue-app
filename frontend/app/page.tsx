"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  PawPrint,
  Heart,
  Shield,
  ShieldCheck,
  Scale,
  BookOpen,
  FileText,
  Users,
  Phone,
  HelpCircle,
  HeartHandshake,
  Handshake,
  ChevronRight,
  Search,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Building2,
  Menu,
  X,
  ChevronDown,
  CalendarClock,
} from "lucide-react";
import dogs from "../data/dogs.json";
import dynamic from "next/dynamic";
import { LocaleSwitch } from "@/src/components/LocaleSwitch";
import { HeroMesh } from "@/src/components/HeroMesh";
import { PawParticles } from "@/src/components/PawParticles";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";

// 3D paw emblem — lazy island, WebGL only on client, never SSR.
const PawEmblem = dynamic(
  () => import("@/src/components/PawEmblem").then((m) => m.PawEmblem),
  { ssr: false, loading: () => null }
);

// ── Synchronous i18n hook ────────────────────────────────────────────────
// Import JSON directly (no dynamic import) so translations work on first render.
import enDict from "../locales/en.json";
import esDict from "../locales/es.json";
import zhDict from "../locales/zh.json";
import zhCNDict from "../locales/zh-CN.json";
import zhTWDict from "../locales/zh-TW.json";
import jaDict from "../locales/ja.json";
import koDict from "../locales/ko.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  zh: zhDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

type LocaleCode = "en" | "es" | "zh" | "zh-CN" | "zh-TW" | "ja" | "ko";

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
        const stored = localStorage.getItem(STORAGE_KEY) as LocaleCode;
        if (stored && Object.keys(LOCALE_DICTS).includes(stored)) setLocaleState(stored);
        else setLocaleState("en");
      } catch {
        setLocaleState("en");
      }
    }
  }, []);

  // Listen for locale changes from LocaleSwitch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: CustomEvent) => {
      const l = e.detail as LocaleCode;
      if (Object.keys(LOCALE_DICTS).includes(l)) setLocaleState(l);
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    return () => window.removeEventListener("rescuehub-locale-change", handler as EventListener);
  }, []);

  const setLocale = useCallback((l: string) => {
    const code = (Object.keys(LOCALE_DICTS).includes(l) ? l : "en") as LocaleCode;
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

// ── Types ──────────────────────────────────────────────────────────────────
type EuthanasiaRisk = "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: EuthanasiaRisk;
  statutoryHoldCleared: boolean;
  intakeTimestamp: string;
  imageUrl?: string;
  sex?: "Male" | "Female";
  personality?: string;
};

// ── Corporate Sponsors (NEUTRAL_ACKNOWLEDGMENT mode — IRC § 513(i)) ────────
// Real company logos served via Clearbit Logo API.
// Value-neutral sponsor acknowledgment — no advertising, endorsements, or CTAs.
const SPONSORS: Array<{
  name: string;
  description: string;
  logoUrl: string;
}> = [
  {
    name: "Chewy",
    description:
      "Chewy provides pet food, supplies, and pharmacy fulfillment services.",
    logoUrl: "https://www.google.com/s2/favicons?domain=chewy.com&sz=128",
  },
  {
    name: "Purina",
    description:
      "Purina produces grain-free, high-protein, and breed-specific dog food formulas.",
    logoUrl: "https://www.google.com/s2/favicons?domain=purina.com&sz=128",
  },
  {
    name: "Petco",
    description:
      "Petco operates retail locations and veterinary services across the United States.",
    logoUrl: "https://www.google.com/s2/favicons?domain=petco.com&sz=128",
  },
  {
    name: "Merrick",
    description:
      "Merrick manufactures grain-free and limited-ingredient pet food sourced from Texas.",
    logoUrl: "https://www.google.com/s2/favicons?domain=merrickpetcare.com&sz=128",
  },
] as const;

// ── Helpers ────────────────────────────────────────────────────────────────
function getAdoptableAnimals(): Dog[] {
  const all = dogs as Dog[];
  return all.filter((d) => d.euthanasia_risk_status !== "IMMEDIATE_BEHAVIORAL");
}

function getRiskLabel(status: EuthanasiaRisk, tr: (key: string, vars?: Record<string, string | number>) => string) {
  switch (status) {
    case "SAFE":
      return { text: tr("adoption_feed.status.available"), class: "text-emerald-700 bg-emerald-50" };
    case "AT_RISK":
      return { text: tr("adoption_feed.status.urgent_sponsor"), class: "text-amber-700 bg-amber-50" };
    case "IMMEDIATE_BEHAVIORAL":
      return { text: tr("adoption_feed.status.under_evaluation"), class: "text-slate-500 bg-slate-100" };
  }
}

function getAgeLabel(age: number, tr: (key: string) => string): string {
  return age === 1 ? `1 ${tr("common.year")}` : `${age} ${tr("common.years")}`;
}

/**
 * Sprint B — dignified deadline copy. Formats the animal's real
 * `strayHoldExpiresAt` date into "Needs a home by {date}" without a
 * fabricated ticking countdown (the old LiveTimer clock showed legal-jargon
 * HOLD OVERDUE states on a public adoption surface).
 */
function getDeadlineLabel(
  animal: { strayHoldExpiresAt?: string; statutoryHoldCleared?: boolean },
  tr: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string | null {
  if (!animal.strayHoldExpiresAt) return null;
  const d = new Date(animal.strayHoldExpiresAt);
  if (Number.isNaN(d.getTime())) return null;
  const dateLabel = d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  return tr("adoption_feed.needs_home_by", { date: dateLabel });
}

// ── Component ──────────────────────────────────────────────────────────────
const HAMBURGER_LINKS = [
  { href: "/about/mission", labelKey: "nav.about.mission", icon: Shield },
  { href: "/about/process", labelKey: "nav.about.process", icon: BookOpen },
  { href: "/about/story", labelKey: "nav.about.story", icon: FileText },
  { href: "/about/team", labelKey: "nav.about.team", icon: Users },
  { href: "/about/partners", labelKey: "nav.about.partners", icon: Handshake },
  { href: "/about/faq", labelKey: "nav.about.faq", icon: HelpCircle },
  { href: "/about/about-us", labelKey: "nav.about.about_us", icon: Building2 },
  { href: "/about/privacy", labelKey: "nav.about.privacy", icon: ShieldCheck },
  { href: "/about/terms", labelKey: "nav.about.terms", icon: Scale },
  { href: "/about/careers", labelKey: "nav.about.careers", icon: HeartHandshake },
  { href: "/about/legal", labelKey: "nav.about.legal", icon: FileText },
  { href: "/about/contact", labelKey: "nav.about.contact", icon: Phone },
] as const;

export default function PublicHomePage() {
  const { locale, tr, setLocale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const adoptable = getAdoptableAnimals();
  const publicDogs = adoptable;
  const behavioralReviewCount = (dogs as Dog[]).filter(
    (d) => d.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL"
  ).length;

  return (
    <div id="main-content" className="min-h-screen font-sans">
      {/* ── Navigation Bar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {tr("site.title")}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {/* About dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                {tr("nav.about.label")}
                <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                {HAMBURGER_LINKS.map(({ href, labelKey, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {tr(labelKey)}
                  </Link>
                ))}
              </div>
            </div>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <LocaleSwitch />
            <Link
              href="/lost-pet-intake"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Search className="h-4 w-4" />
              {tr("nav.find_my_pet")}
            </Link>
            <Link
              href="/intake/public"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Heart className="h-4 w-4" />
              {tr("nav.surrender")}
            </Link>
            <Link
              href="/fundraising"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <DollarSign className="h-4 w-4" />
              {tr("nav.fundraising")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#059669] active:scale-[0.98]"
            >
              {tr("nav.staff_login")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Hamburger (mobile) */}
          <div className="flex items-center gap-2 md:hidden">
            <LocaleSwitch />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-slate-200/60 bg-white px-6 pb-4 pt-2 md:hidden"
          >
            <div className="space-y-1">
              {HAMBURGER_LINKS.map(({ href, labelKey, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {tr(labelKey)}
                </Link>
              ))}
              <hr className="my-2 border-slate-100" />
              <Link
                href="/lost-pet-intake"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Search className="h-4 w-4 text-slate-400" />
                {tr("nav.find_my_pet")}
              </Link>
              <Link
                href="/intake/public"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Heart className="h-4 w-4 text-slate-400" />
                {tr("nav.surrender")}
              </Link>
              <Link
                href="/fundraising"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <DollarSign className="h-4 w-4 text-slate-400" />
                {tr("nav.fundraising")}
              </Link>
              <hr className="my-2 border-slate-100" />
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                {tr("nav.staff_login")}
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative w-full h-[85vh] overflow-hidden flex items-center justify-center bg-transparent">
        <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
          <HeroMesh />
          <PawParticles />
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(203,213,225,0.3)] border border-white/60 p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-semibold tracking-wide text-cyan-700">
                <Shield className="h-3.5 w-3.5" />
                {tr("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-[#334155] sm:text-5xl lg:text-6xl"
            >
              {tr("hero.headline")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#64748B]"
            >
              {tr("site.description")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                href="/lost-pet-intake"
                className="inline-flex items-center gap-2 rounded-xl bg-[#334155] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-700/25 transition hover:bg-[#1e293b] hover:shadow-xl active:scale-[0.97]"
              >
                <Search className="h-4 w-4" />
                {tr("hero.cta_lost_pet")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/fundraising"
                className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-[#059669] hover:shadow-xl active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" />
                {tr("hero.cta_crowdfunding")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/intake/public"
                className="inline-flex items-center gap-2 rounded-xl bg-transparent border-2 border-slate-300 px-6 py-3 text-sm font-semibold text-[#334155] shadow-sm transition hover:bg-white/50 active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" />
                {tr("hero.cta_surrender")}
            </Link>
          </motion.div>
        </div>

        {/* Signature 3D paw emblem — lazy WebGL island, right of the CTA card */}
        <div className="absolute right-[6%] top-1/2 z-10 hidden -translate-y-1/2 lg:block xl:right-[10%]">
          <PawEmblem />
        </div>

        {/* §Step 4 — featured animal photo, left of the CTA card */}
        {adoptable[0]?.imageUrl && (
          <div className="absolute left-[6%] top-1/2 z-10 hidden w-72 -translate-y-1/2 lg:block xl:left-[9%]">
            <Link
              href={`/adopt/${adoptable[0].id}`}
              className="group block overflow-hidden rounded-3xl border-4 border-white/70 bg-white shadow-2xl shadow-emerald-900/20 backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-emerald-900/30"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <AnimalPhoto
                  src={adoptable[0].imageUrl}
                  alt={adoptable[0].name}
                  priority
                  roundedClassName=""
                  className="transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 288px, 0px"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {adoptable[0].name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tr(`breeds.${adoptable[0].breed}`)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* ── Public Adoption Broadcast Feed ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-500" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {tr("adoption_feed.title")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <span>{tr("adoption_feed.available", { count: publicDogs.length })} </span>
              {behavioralReviewCount > 0 && (
                <span className="text-amber-600">
                  {tr("adoption_feed.excluded", { count: behavioralReviewCount })}{" "}
                </span>
              )}
              <span className="text-xs text-slate-400">
                ({tr("adoption_feed.compliance_note")})
              </span>
            </p>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adoptable.map((animal, i) => {
            const risk = getRiskLabel(animal.euthanasia_risk_status, tr);
            return (
              <motion.div
                key={animal.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div
                  className={`absolute left-0 right-0 top-0 h-1 ${
                    animal.medicalStatus === "Healthy"
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />

                {/* §Step 4 — photo-first lead image */}
                <div className="relative -mx-5 -mt-5 mb-4 h-44 overflow-hidden">
                  <AnimalPhoto
                    src={animal.imageUrl}
                    alt={animal.name}
                    priority={i < 3}
                    roundedClassName=""
                    className="transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>

                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                          {animal.name}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">
                          {tr(`breeds.${animal.breed}`)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${risk.class}`}
                      >
                        {risk.text}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400">
                      <span>{getAgeLabel(animal.age, (k) => t(locale, k))}</span>
                      <span className="h-3 w-px bg-slate-200" />
                      <span
                        className={
                          animal.medicalStatus === "Healthy"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }
                      >
                        {tr(`medical.${animal.medicalStatus}`)}
                      </span>
                    </div>

                    {/* Sex chip — honest roster attribute (review §3.4). */}
                    {animal.sex && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                          {animal.sex === "Female"
                            ? tr("adopt.sex_female")
                            : tr("adopt.sex_male")}
                        </span>
                      </div>
                    )}

                    {/* Personality blurb — one honest line, not a fabricated bio. */}
                    {animal.personality && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {animal.personality}
                      </p>
                    )}

                    {animal.euthanasia_risk_status === "AT_RISK" && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {tr("adoption_feed.at_risk_badge")}
                      </div>
                    )}

                    {/* Sprint B — live availability + dignified deadline copy */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                      {animal.statutoryHoldCleared ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          {tr("adoption_feed.still_available")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          {tr("adoption_feed.on_hold")}
                        </span>
                      )}
                      {getDeadlineLabel(animal, (k, vars) => tr(k, vars), locale) && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-3 w-3 text-slate-400" />
                          {getDeadlineLabel(animal, (k, vars) => tr(k, vars), locale)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sprint B — always-visible CTA to adopter profile */}
                <Link
                  href={`/adopt/${animal.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-[0.98]"
                >
                  <Heart className="h-4 w-4" />
                  {tr("adoption_feed.meet_name", { name: animal.name })}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {adoptable.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Search className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              {tr("adoption_feed.empty_state")}
            </p>
          </div>
        )}
      </section>

      {/* ── Corporate Sponsor Section ──────────────────────────────── */}
      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {tr("sponsors.title")}
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {tr("sponsors.description")}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
            {SPONSORS.map((sponsor, i) => (
              <motion.div
                key={sponsor.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white p-2">
                  <img
                    src={sponsor.logoUrl}
                    alt={`${sponsor.name} logo`}
                    className="object-contain h-10 w-auto max-w-full"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {sponsor.name}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {sponsor.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {tr("sponsors.compliance_title")}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                  {tr("sponsors.compliance_body")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Action Cards ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Public Surrender */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/intake/public"
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <Heart className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {tr("quick_links.surrender_title")}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                  {tr("quick_links.surrender_body")}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition group-hover:gap-1.5">
                  {tr("quick_links.surrender_cta")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Emergency Crowdfunding */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/fundraising"
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">
                  {tr("quick_links.fundraising_title")}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                  {tr("quick_links.fundraising_body")}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-600 transition group-hover:gap-1.5">
                  {tr("quick_links.fundraising_cta")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-emerald-500" />
                <span className="text-base font-bold text-slate-900">
                  {tr("site.title")}
                </span>
              </div>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
                {tr("footer.tagline")}
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
                  {tr("footer.public_section")}
                </p>
                <ul className="space-y-1.5">
                  <li>
                    <Link
                      href="/intake/public"
                      className="text-sm text-slate-600 transition hover:text-slate-900"
                    >
                      {tr("footer.surrender_portal")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/fundraising"
                      className="text-sm text-slate-600 transition hover:text-slate-900"
                    >
                      {tr("footer.fundraising_campaigns")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/"
                      className="text-sm text-slate-600 transition hover:text-slate-900"
                    >
                      {tr("footer.adoption_feed")}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
                  {tr("footer.platform_section")}
                </p>
                <ul className="space-y-1.5">
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm text-slate-600 transition hover:text-slate-900"
                    >
                      {tr("nav.staff_login")}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
            {tr("footer.copyright", { year: String(new Date().getFullYear()) })}
          </div>
        </div>
      </footer>
    </div>
  );
}