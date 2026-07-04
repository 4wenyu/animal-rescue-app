"use client";

import { useState, useEffect } from "react";

import { useI18n } from "@/src/lib/useI18n";

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
  /* ---- i18n ------------------------------------------------------------ */
  // Localized timer units (e.g. "5h 12m 03s" en / "5时 12分 03秒" zh-CN)
  // come from the shared useI18n hook so the timer stays in lockstep with
  // the rest of the dashboard's locale-switch behavior (window storage +
  // rescuehub-locale-change event). The previous in-component `t()` was a
  // near-duplicate of `useI18n.t()` that did NOT support interpolation;
  // migrating to useI18n unblocks localized numeric unit suffixes.
  const { tr } = useI18n();

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
  // Raw remaining ms is monotonically negative once the hold has expired
  // (e.g. -100,800,000 ms when 28h past deadline). We MUST evaluate the
  // isOverdue boolean against the raw value (so it fires correctly), AND
  // clamp the published value to zero (so the display never counts past
  // expiry and never shows negative time).
  //
  // Feeding a negative value into formatHms() was producing
  // counting-up behavior ("300h 00m 00s" past expiration) because that
  // helper took `Math.abs(ms)`. The patch below Path 1: clamp the
  // published remainingMs; Path 2: drop the Math.abs in formatHms so the
  // helper trusts its input to be non-negative.
  const rawRemainingMs = holdMs - (now - intakeMs);

  const isCleared = statutoryHoldCleared || isNaN(intakeMs);
  const isOverdue = !isCleared && rawRemainingMs <= 0;
  const isActive = !isCleared && !isOverdue;
  // Published value: the user-facing remaining ms. Clamped to zero so the
  // displayed countdown cannot tick backward through negative territory.
  const remainingMs = Math.max(0, rawRemainingMs);

  // ── Format helpers ────────────────────────────────────────────────────────
  // Returns the three digit parts of an h/m/s countdown as a typed object,
  // assuming the input is already non-negative. Clamping the published
  // `remainingMs = Math.max(0, rawRemainingMs)` two scopes above means
  // this helper never sees a negative value — the previous `Math.abs(ms)`
  // call was masking the upstream bug where `isOverdue` was firing but
  // the formatter was absolutizing the negative ms and counting upward.
  //
  // IMPORTANT: minute and second are zero-padded to 2 digits. The locale
  // template is the only place where suffix letters/characters go; the
  // padding decision is structural and locale-independent (`05分` reads
  // correctly in ja, `05m` reads correctly in ko, etc.).
  function formatHms(ms: number): { h: number; m: string; s: string } {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return { h, m, s };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Cleared — calm green badge
  if (isCleared) {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-sm font-bold text-emerald-700">
        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        {tr("clock.hold_cleared")}
      </span>
    );
  }

  // Active hold — amber ticking clock.
  // Same responsive layout as the overdue state:
  //   - flex column, items-center, text-center → helper texts wrap cleanly
  //     below the digits regardless of locale (en "remaining" / zh-CN
  //     "剩余" / ja "残り" / etc.).
  //   - text-lg + tracking-tight on digits → less horizontal real estate
  //     than text-xl; tabular-nums preserves the per-second tick rhythm.
  //   - max-w-full + whitespace-nowrap on digits + break-words w-full on
  //     the helper/footer strings → digits never break mid-number, locale
  //     strings wrap inside the pill instead of pushing the cell wider.
  if (isActive) {
    const timeParts = formatHms(remainingMs);
    const timeStr = tr("dashboard.timer_format", timeParts);
    return (
      <div className="flex flex-col items-center text-center bg-amber-100 text-amber-700 border-2 border-amber-400 px-2.5 py-2 rounded-lg max-w-full">
        <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-0.5 break-words w-full">
          {tr("clock.stray_hold_active")}
        </div>
        <div className="text-lg font-black font-mono tabular-nums tracking-tight whitespace-nowrap">
          {timeStr}
        </div>
        <div className="text-[10px] mt-0.5 opacity-50 break-words w-full">
          {tr("clock.remaining")}
        </div>
      </div>
    );
  }

  // Overdue — pulsing red screaming urgency box.
  // Layout retrofit (responsive Tighten-Up):
  //   - `flex flex-col items-center text-center` guarantees the inner blocks
  //     stack vertically and stay centered regardless of locale-specific
  //     helper text length (en / es "overdue — legal action required" /
  //     zh-CN "逾期 — 需要法律行动" all wrap cleanly inside the pill instead
  //     of overflowing the table cell horizontally.
  //   - `max-w-full` + the trailing `break-words` on each child ensure the
  //     worst-case localized helper still respects the cell boundary.
  //   - Timer number scaled from text-2xl → text-lg (same step applied to
  //     the "HH:MM:SS" digits at line 149 sibling) so the columns for
  //     English "00d 00h 00m 00s" or German "0T 00Std" don't dominate
  //     horizontal real estate. tracking-tight preserves numerical rhythm.
  //   - `font-black` retained for the urgency visual cue.
  //   - Locale template (`dashboard.timer_format`) renders h/m/s digits in
  //     the user's chosen units — "5h 12m 03s" (en) / "5时 12分 03秒"
  //     (zh-CN) / "5時間 12分 03秒" (ja) / "5시간 12분 03초" (ko).
  const timeParts = formatHms(remainingMs);
  const timeStr = tr("dashboard.timer_format", timeParts);
  return (
    <div className="flex flex-col items-center text-center bg-red-100 text-red-600 border-2 border-red-500 px-2.5 py-2 rounded-lg animate-pulse max-w-full">
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5 break-words w-full">
        {tr("clock.hold_overdue")}
      </div>
      <div className="text-lg font-black font-mono tabular-nums tracking-tight whitespace-nowrap">
        {timeStr}
      </div>
      <div className="text-[10px] mt-0.5 font-semibold opacity-70 break-words w-full">
        {tr("clock.legal_action_required")}
      </div>
    </div>
  );
}