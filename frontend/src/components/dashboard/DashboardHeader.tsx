"use client";

import Link from "next/link";
import { ChevronRight, PawPrint, Search, ShieldCheck } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

export function DashboardHeader({
  displayName,
  totalDogs,
  staff,
  filter,
  onClearFilter,
  onFindPet,
}: {
  displayName: string;
  totalDogs: number;
  staff: boolean;
  filter: string | null;
  onClearFilter: () => void;
  onFindPet: () => void;
}) {
  const { tr } = useI18n();
  const hello = displayName
    ? tr("dashboard.hello_named", { name: displayName })
    : tr("dashboard.hello");

  return (
    <header className="mb-8 border-b border-slate-200/60 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900" suppressHydrationWarning>
            {hello}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600" suppressHydrationWarning>
            {staff ? (
              <span className="inline-flex items-center gap-1">
                <PawPrint className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                {tr("dashboard.active_roster", { count: totalDogs })}
              </span>
            ) : (
              tr("dashboard.citizen_sub")
            )}
            {staff && filter ? (
              <button
                type="button"
                onClick={onClearFilter}
                className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-600"
              >
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {tr("dashboard.clear_filter", { filter })}
              </button>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onFindPet}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {tr("dashboard.find_my_pet")}
          </button>
          {staff ? (
            <Link
              href="/intake/public"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <PawPrint className="h-4 w-4" aria-hidden="true" />
              {tr("dashboard.add_animal")}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
