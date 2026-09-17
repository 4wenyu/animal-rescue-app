/**
 * SearchSummaryCard — the captured-intake card for /radar/[searchId].
 *
 * Renders the persistent LostPetSearch row's captured fields (species,
 * breed, colorMarkings, collarId, lastSeen) pulled from the search DTO,
 * plus the raw search id footer.
 */

import { Circle, Heart, MapPin, PawPrint, ShieldCheck, Tag } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { SearchDto, TrFn } from "./types";

function SummaryRow({
  icon: Icon,
  label,
  value,
  tr,
}: {
  icon: typeof PawPrint;
  label: string;
  value: string | null;
  tr: TrFn;
}) {
  const present = typeof value === "string" && value.trim().length > 0;
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          present ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {present ? (
          <Icon className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm ${
            present ? "font-medium text-slate-900" : "italic text-slate-400"
          }`}
        >
          {present ? value : tr("radar.missing")}
        </p>
      </div>
    </div>
  );
}

export function SearchSummaryCard({ search }: { search: SearchDto }) {
  const { tr } = useI18n();
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          {tr("radar.captured_intake")}
        </h3>
      </div>
      <dl className="space-y-3">
        <SummaryRow icon={PawPrint} label={tr("radar.species")} value={search.species} tr={tr} />
        <SummaryRow icon={Tag} label={tr("radar.breed")} value={search.breed} tr={tr} />
        <SummaryRow icon={Heart} label={tr("radar.color_markings")} value={search.colorMarkings} tr={tr} />
        <SummaryRow icon={ShieldCheck} label={tr("radar.collar_id")} value={search.collarId} tr={tr} />
        <SummaryRow icon={MapPin} label={tr("radar.last_seen")} value={search.lastSeen} tr={tr} />
      </dl>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {tr("radar.search_id")}
        </p>
        <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
          {search.searchId}
        </p>
      </div>
    </div>
  );
}
