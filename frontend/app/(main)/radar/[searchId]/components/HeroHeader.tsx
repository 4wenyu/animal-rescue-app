/**
 * HeroHeader — gradient hero for /radar/[searchId].
 *
 * Shows the search state headline with the owner's terminal actions
 * (Mark as found / Cancel while searching; Back to dashboard once
 * terminal). The decorative glow uses a Tailwind arbitrary-value
 * background instead of an inline style.
 */

import { CheckCircle2, Circle, Radio, X } from "lucide-react";
import { useMemo } from "react";

import { useI18n } from "@/src/lib/useI18n";

import type { SearchDto } from "./types";

export function HeroHeader({
  search,
  patching,
  onClose,
  onSetStatus,
}: {
  search: SearchDto;
  patching: boolean;
  onClose: () => void;
  onSetStatus: (status: "FOUND" | "CANCELLED") => void;
}) {
  const { tr } = useI18n();
  const activatedAtFormatted = useMemo(() => {
    const d = new Date(search.activatedAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [search.activatedAt]);

  const terminal = search.status !== "SEARCHING";
  const headline = terminal
    ? search.status === "FOUND"
      ? tr("radar.headline_found")
      : tr("radar.headline_cancelled")
    : tr("radar.headline_active");
  const subline = terminal
    ? search.status === "FOUND"
      ? tr("radar.subline_found")
      : tr("radar.subline_cancelled")
    : tr("radar.subline_active", { date: activatedAtFormatted });

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 p-8 text-white shadow-lg">
      <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-50">
            <Radio className="h-3 w-3" />
            {tr("radar.hero_eyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{headline}</h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">{subline}</p>
          {!terminal && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-emerald-50">
              <Circle className="h-2 w-2" />
              {tr("radar.demo_pill")}
            </p>
          )}
        </div>

        {terminal ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white active:scale-[0.97]"
          >
            <CheckCircle2 className="h-4 w-4" />
            {tr("radar.back_to_dashboard")}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={patching}
              onClick={() => onSetStatus("FOUND")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {patching ? tr("radar.updating") : tr("radar.mark_as_found")}
            </button>
            <button
              type="button"
              disabled={patching}
              onClick={() => onSetStatus("CANCELLED")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              {tr("radar.cancel_search")}
            </button>
          </div>
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,white_0px,transparent_50%),radial-gradient(circle_at_80%_20%,white_0px,transparent_60%)] opacity-30"
        aria-hidden
      />
    </div>
  );
}
