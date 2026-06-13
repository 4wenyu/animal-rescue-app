"use client";

import { useState, useEffect } from "react";
import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhDict from "../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  zh: zhDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

function getLocale(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "zh") return stored;
  } catch {}
  return "en";
}

function t(key: string): string {
  const locale = getLocale();
  const parts = key.split(".");
  let value: unknown = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}

interface LiveTimerProps {
  intakeTimestamp: string;
  holdDurationHours?: number;
  statutoryHoldCleared?: boolean;
}

/**
 * LiveTimer — True ticking countdown clock.
 *
 * Calculates the difference between now and intakeTimestamp + holdDurationHours
 * and repaints the seconds digit every tick using setInterval(..., 1000).
 *
 * Uses a mounted-state guard to prevent SSR hydration mismatch:
 * returns null during server render and first client render cycle,
 * then mounts the real ticking clock on the next tick.
 *
 * Output format: "48h 12m 05s" (precise to the second).
 *
 * Three visual states:
 *   Active hold   → large amber warning box with ticking clock
 *   Overdue hold  → large pulsing red screaming urgency box
 *   Cleared hold  → green success badge
 *
 * All labels are i18n-aware via localised clock.* dictionary keys.
 */
export function LiveTimer({
  intakeTimestamp,
  holdDurationHours = 72,
  statutoryHoldCleared = false,
}: LiveTimerProps) {
  const [now, setNow] = useState(Date.now);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Hydration guard — return null until mounted on the client ──────────
  // Prevents server-to-client mismatch: server renders no clock,
  // first client render still returns null, second tick hydrates.
  if (!isMounted) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-slate-400">
        <span className="flex h-2.5 w-2.5 rounded-full bg-slate-300" />
        --
      </span>
    );
  }

  // ── Math: compute remaining / overdue from raw ms ────────────────────────
  const intakeMs = new Date(intakeTimestamp).getTime();
  const holdMs = holdDurationHours * 60 * 60 * 1000;
  const remainingMs = holdMs - (now - intakeMs);

  const isCleared = statutoryHoldCleared || isNaN(intakeMs);
  const isOverdue = !isCleared && remainingMs <= 0;
  const isActive = !isCleared && !isOverdue;

  // ── Format helpers ────────────────────────────────────────────────────────
  function formatHms(ms: number): string {
    const abs = Math.abs(ms);
    const totalSec = Math.floor(abs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Cleared — calm green badge
  if (isCleared) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-emerald-700">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        {t("clock.hold_cleared")}
      </span>
    );
  }

  // Active hold — large amber ticking clock
  if (isActive) {
    const timeStr = formatHms(remainingMs);
    return (
      <div className="bg-amber-100 text-amber-700 border-2 border-amber-400 p-2 rounded-lg">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-0.5">
          {t("clock.stray_hold_active")}
        </div>
        <div className="text-xl font-black font-mono tabular-nums tracking-tight">
          {timeStr}
        </div>
        <div className="text-[10px] mt-0.5 opacity-50">
          {t("clock.remaining")}
        </div>
      </div>
    );
  }

  // Overdue — pulsing red screaming urgency box, slightly larger
  const timeStr = formatHms(remainingMs);
  return (
    <div className="bg-red-100 text-red-600 border-2 border-red-500 p-2 rounded-lg animate-pulse">
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
        {t("clock.hold_overdue")}
      </div>
      <div className="text-2xl font-black font-mono tabular-nums tracking-tight">
        {timeStr}
      </div>
      <div className="text-[10px] mt-0.5 font-semibold opacity-70">
        {t("clock.legal_action_required")}
      </div>
    </div>
  );
}