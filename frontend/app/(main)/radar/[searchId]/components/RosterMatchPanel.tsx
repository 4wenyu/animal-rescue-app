"use client";

import Link from "next/link";

import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { useI18n } from "@/src/lib/useI18n";

import type { RosterHitDto } from "./types";

export function RosterMatchPanel({ hits }: { hits: RosterHitDto[] }) {
  const { tr } = useI18n();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900">
        {tr("radar.roster_hits_title")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {tr("radar.roster_hits_note")}
      </p>
      {hits.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{tr("radar.roster_hits_empty")}</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {hits.map((hit) => (
            <li
              key={hit.animalId}
              className="overflow-hidden rounded-2xl border border-slate-200"
            >
              <Link href={`/adopt/${hit.profileId}`} className="flex gap-3 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <AnimalPhoto src={hit.imageUrl} alt={hit.name} sizes="64px" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{hit.name}</p>
                  <p className="truncate text-xs text-slate-500">{hit.breed}</p>
                  {hit.city ? (
                    <p className="truncate text-xs text-slate-500">{hit.city}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {tr("radar.roster_hit_open")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
