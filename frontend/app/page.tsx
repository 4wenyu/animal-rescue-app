"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  PawPrint,
  Heart,
  Shield,
  ChevronRight,
  Search,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Building2,
  Menu,
  X,
  Scale,
  BookOpen,
  FileText,
  Users,
  Phone,
  ChevronDown,
  Clock,
} from "lucide-react";
import dogs from "../data/dogs.json";
import { LocaleSwitch } from "@/src/components/LocaleSwitch";
import { LiveTimer } from "@/src/components/LiveTimer";
import { Hero3D } from "@/src/components/Hero3D";

// ── Synchronous i18n hook ────────────────────────────────────────────────
// Import JSON directly (no dynamic import) so translations work on first render.
import enDict from "../locales/en.json";
import esDict from "../locales/es.json";
import zhDict from "../locales/zh.json";

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

  // Listen for locale changes from LocaleSwitch
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

// ── Component ──────────────────────────────────────────────────────────────
const HAMBURGER_LINKS = [
  { href: "/about", label: "Mission", icon: Shield },
  { href: "/legal", label: "Legal", icon: Scale },
  { href: "/process", label: "Process", icon: BookOpen },
  { href: "/story", label: "Story", icon: FileText },
  { href: "/about", label: "About Us", icon: Users },
  { href: "/contact", label: "Contact", icon: Phone },
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
    <div className="min-h-screen font-sans">
      {/* ── Navigation Bar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
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
                About
                <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                {HAMBURGER_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Icon className="h-4 w-4 text-slate-400" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <LocaleSwitch />
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
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
              {HAMBURGER_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {label}
                </Link>
              ))}
              <hr className="my-2 border-slate-100" />
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
          <Hero3D />
        </div>
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-24 pt-20 text-center">
          <div className="inline-block rounded-2xl bg-white/70 p-8 shadow-lg shadow-slate-900/5 backdrop-blur-md sm:p-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-emerald-700">
                <Shield className="h-3.5 w-3.5" />
                {tr("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              {tr("hero.headline")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600"
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
                href="/fundraising"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-700 hover:shadow-xl active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" />
                {tr("hero.cta_crowdfunding")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/intake/public"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" />
                {tr("hero.cta_surrender")}
            </Link>
          </motion.div>
          </div>
        </div>
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

                <div className="flex items-start gap-4">
                  {animal.imageUrl ? (
                    <img
                      src={animal.imageUrl}
                      alt={animal.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover border border-slate-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <PawPrint className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
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

                    {animal.euthanasia_risk_status === "AT_RISK" && (
                      <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        {tr("adoption_feed.at_risk_badge")}
                      </div>
                    )}

                    {/* Blueprint §3 — Live ticking clock */}
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <LiveTimer
                        intakeTimestamp={animal.intakeTimestamp}
                        holdDurationHours={72}
                        statutoryHoldCleared={animal.statutoryHoldCleared}
                      />
                    </div>
                  </div>
                </div>

                {/* §4.1 — View details routes to /hold-profile/[id] */}
                <Link
                  href={`/hold-profile/${animal.id}`}
                  className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100"
                >
                  <span>{tr("adoption_feed.view_details")}</span>
                  <ArrowRight className="h-3 w-3" />
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