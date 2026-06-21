"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Ban,
  ShieldCheck,
  PawPrint,
  HeartPulse,
  User,
} from "lucide-react";
import { LiveTimer } from "@/src/components/LiveTimer";
import { ShareToHelpButton } from "@/src/components/dashboard/ShareToHelpButton";

// ── Synchronous i18n ─────────────────────────────────────────────────────
import enDict from "../../../locales/en.json";
import esDict from "../../../locales/es.json";
import zhDict from "../../../locales/zh.json";

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

  const tr = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(locale, key, vars),
    [locale]
  );

  return { locale, tr };
}

interface Dog {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  intakeTimestamp: string;
  imageUrl?: string;
}

interface AnimalTableProps {
  dogs: Dog[];
  onViewAll?: () => void;
}

// ── Breed BSL Safety ────────────────────────────────────────────────────
const BSL_RESTRICTED_BREEDS = [
  "Pit Bull",
  "Rottweiler",
  "German Shepherd",
  "Doberman Pinscher",
  "American Staffordshire Terrier",
  "Cane Corso",
  "Presa Canario",
];

function isBSLRestricted(breed: string): boolean {
  return BSL_RESTRICTED_BREEDS.some((b) => breed.toLowerCase().includes(b.toLowerCase()));
}

function getDisplayBreed(dog: Dog, tr: (k: string, v?: Record<string, string | number>) => string): string {
  if (isBSLRestricted(dog.breed)) {
    return `${dog.breed} ${tr("dashboard.table.bsl_suffix")}`;
  }
  return dog.breed;
}

// ── Thematic avatar by breed/context ──────────────────────────────────────
function AnimalAvatar({ dog, size = 28 }: { dog: Dog; size?: number }) {
  if (dog.imageUrl) {
    return (
      <img
        src={dog.imageUrl}
        alt={dog.name}
        className="object-cover rounded-full border border-slate-200 shrink-0"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  const Icon = isBSLRestricted(dog.breed) ? ShieldCheck : PawPrint;
  return (
    <div
      className="flex items-center justify-center rounded-full bg-slate-100 text-slate-400 shrink-0"
      style={{ width: size, height: size }}
    >
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}

// ── Risk Badge ──────────────────────────────────────────────────────────
function RiskBadge({ status, tr }: { status: Dog["euthanasia_risk_status"]; tr: (k: string) => string }) {
  const config = {
    SAFE: {
      label: tr("dashboard.badges.safe"),
      class: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: ShieldCheck,
    },
    AT_RISK: {
      label: tr("dashboard.badges.at_risk"),
      class: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertTriangle,
    },
    IMMEDIATE_BEHAVIORAL: {
      label: tr("dashboard.badges.hayden_act"),
      class: "bg-red-50 text-red-700 border-red-300 animate-pulse",
      icon: ShieldAlert,
    },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
        c.class
      }`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

// ── Stray Hold Badge ────────────────────────────────────────────────────
function StrayHoldBadge({ dog, tr }: { dog: Dog; tr: (k: string) => string }) {
  const isHaydenAct = dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL";

  if (isHaydenAct) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-red-50 text-red-700 border border-red-300">
          <ShieldAlert className="h-3 w-3" />
          {tr("dashboard.table.locked")}
        </span>
        <span className="text-[11px] text-slate-400">
          {tr("dashboard.table.hayden_note")}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-[180px]">
      <LiveTimer
        intakeTimestamp={dog.intakeTimestamp}
        holdDurationHours={72}
        statutoryHoldCleared={dog.statutoryHoldCleared}
      />
    </div>
  );
}

// ── Action Buttons ──────────────────────────────────────────────────────
function ActionButtons({ dog, tr }: { dog: Dog; tr: (k: string) => string }) {
  const isHaydenAct = dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL";
  const canAct = dog.statutoryHoldCleared && !isHaydenAct;

  return (
    <div className="flex items-center gap-2 relative z-10" onClick={(e) => e.stopPropagation()}>
      <button
        disabled={!canAct}
        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${
          canAct
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        title={
          isHaydenAct
            ? "Legally restricted — Hayden Act exception in effect"
            : !dog.statutoryHoldCleared
              ? "Stray hold not yet cleared"
              : "Mark as adopted"
        }
      >
        {isHaydenAct ? (
          <span className="inline-flex items-center gap-1">
            <Ban className="h-3 w-3" /> {tr("dashboard.table.locked_btn")}
          </span>
        ) : !dog.statutoryHoldCleared ? (
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> {tr("dashboard.table.on_hold")}
          </span>
        ) : (
          tr("dashboard.table.adopt")
        )}
      </button>
      <button
        disabled={!canAct}
        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition ${
          canAct
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        }`}
        title={
          isHaydenAct
            ? "Legally restricted"
            : !dog.statutoryHoldCleared
              ? "Stray hold not yet cleared"
              : "Transfer to another organization"
        }
      >
        {isHaydenAct ? (
          <span className="inline-flex items-center gap-1">
            <Ban className="h-3 w-3" /> {tr("dashboard.table.locked_btn")}
          </span>
        ) : !dog.statutoryHoldCleared ? (
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> {tr("dashboard.table.on_hold")}
          </span>
        ) : (
          tr("dashboard.table.transfer")
        )}
      </button>
      <ShareToHelpButton relatedAnimalId={dog.id} />
    </div>
  );
}

// ── Thematic medical icon ──────────────────────────────────────────────
function MedicalBadge({ status, tr }: { status: string; tr: (k: string) => string }) {
  // Map the dog.medicalStatus string ("Healthy" / "Needs Review" / ...) onto the
  // localized dictionary key `dashboard.medical.<status>`. Falls back to the
  // raw status string if no entry exists (forward compat for new statuses).
  const normalizedStatus = status.replace(/ /g, "_");
  const label = tr(`dashboard.medical.${normalizedStatus}`);
  const wasTranslated = label !== `dashboard.medical.${normalizedStatus}`;
  const Icon = status === "Healthy" ? HeartPulse : User;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        status === "Healthy"
          ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/70"
          : "bg-amber-50/80 text-amber-700 border-amber-200/70"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "Healthy" ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {wasTranslated ? label : status}
      <Icon className="h-3 w-3 ml-0.5" />
    </span>
  );
}

// ── Animations ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 130, damping: 16 },
  },
};

// ── Component ───────────────────────────────────────────────────────────
export function AnimalTable({ dogs, onViewAll }: AnimalTableProps) {
  const { tr } = useI18n();
  const lockedCount = dogs.filter((d) => !d.statutoryHoldCleared).length;
  const haydenCount = dogs.filter(
    (d) => d.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL",
  ).length;
  const clearedCount = dogs.filter((d) => d.statutoryHoldCleared).length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {/* ── Stray Hold Guardian header ──────────────────────────────── */}
      <motion.div
        variants={rowVariant}
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-800">
              {tr("dashboard.table.title")}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              — {tr("dashboard.table.subtitle")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3 text-amber-500" />
              {tr("dashboard.table.active_holds", { count: lockedCount, plural: lockedCount !== 1 ? "s" : "" })}
            </span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Unlock className="h-3 w-3 text-emerald-500" />
              {tr("dashboard.table.cleared", { count: clearedCount })}
            </span>
            {haydenCount > 0 && (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-red-500" />
                  {tr("dashboard.table.hayden_act", { count: haydenCount })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="group/va inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 transition-colors hover:text-emerald-600"
        >
          <span>{tr("dashboard.table.view_all")}</span>
          <ChevronRight className="h-3 w-3 transition-transform duration-200 group-hover/va:translate-x-1" />
        </button>
      </motion.div>

      {/* ── Triage Table ────────────────────────────────────────────── */}
      <motion.div
        variants={rowVariant}
        className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/60 border-b border-slate-200">
              <th className="p-4 pl-6 text-xs font-semibold tracking-wider uppercase text-slate-500">
                {tr("dashboard.table.columns.animal")}
              </th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                {tr("dashboard.table.columns.breed")}
              </th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                {tr("dashboard.table.columns.age")}
              </th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {tr("dashboard.table.columns.euth_risk")}
                </span>
              </th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {tr("dashboard.table.columns.legal_status")}
                </span>
              </th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                {tr("dashboard.table.columns.actions")}
              </th>
              <th className="p-4 pr-6 text-xs font-semibold tracking-wider uppercase text-slate-500 text-right">
                <span className="inline-flex items-center gap-1 justify-end">
                  <HeartPulse className="h-3 w-3" />
                  {tr("dashboard.table.columns.medical")}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {dogs.map((dog) => {
              const rowBg =
                dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL"
                  ? "bg-red-50/40 hover:bg-red-50/60"
                  : dog.euthanasia_risk_status === "AT_RISK"
                    ? "bg-amber-50/30 hover:bg-amber-50/50"
                    : !dog.statutoryHoldCleared
                      ? "hover:bg-blue-50/30"
                      : "hover:bg-slate-50/80";
              return (
                <motion.tr
                  key={dog.id}
                  variants={rowVariant}
                  className={`${rowBg} transition-all duration-200 cursor-pointer relative`}
                  onClick={() => {
                    window.location.href = `/hold-profile/${dog.id}`;
                  }}
                >
                  {/* Name + Avatar */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <AnimalAvatar dog={dog} size={36} />
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {dog.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          #{dog.id}
                        </span>
                      </div>
                      {dog.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold tracking-wide ml-1">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          {tr("dashboard.badges.hayden_tag")}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Breed — BSL-safe display */}
                  <td className="p-4">
                    <span className="text-slate-600">
                      {getDisplayBreed(dog, tr)}
                    </span>
                  </td>

                  {/* Age */}
                  <td className="p-4">
                    <span className="text-slate-600">
                      {dog.age}{" "}
                      <span className="text-xs text-slate-400">
                        {dog.age === 1 ? tr("dashboard.table.age_yr") : tr("dashboard.table.age_yrs")}
                      </span>
                    </span>
                  </td>

                  {/* Euthanasia Risk */}
                  <td className="p-4">
                    <RiskBadge status={dog.euthanasia_risk_status} tr={tr} />
                  </td>

                  {/* Legal Status — massive ticking LiveTimer */}
                  <td className="p-4">
                    <StrayHoldBadge dog={dog} tr={tr} />
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <ActionButtons dog={dog} tr={tr} />
                  </td>

                  {/* Medical Status */}
                  <td className="p-4 pr-6 text-right">
                    <MedicalBadge status={dog.medicalStatus} tr={tr} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* ── Compliance Footer ─────────────────────────────────────────── */}
      <motion.div
        variants={rowVariant}
        className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400"
      >
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          {tr("dashboard.table.compliance_footer")}
        </span>
      </motion.div>
    </motion.div>
  );
}