"use client";

import Link from "next/link";
import { Activity, ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";

import type { Dog } from "@/src/components/home/types";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { useI18n } from "@/src/lib/useI18n";

type Props = {
  dogs: Dog[];
  backHref: string;
  backLabelKey: string;
};

export function MedicalRoster({ dogs, backHref, backLabelKey }: Props) {
  const { tr } = useI18n();
  const sorted = dogs.toSorted((a, b) => {
    const rank = (status: string) => (status === "Needs Review" ? 0 : 1);
    return rank(a.medicalStatus) - rank(b.medicalStatus) || a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr(backLabelKey)}
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
            <HeartPulse className="h-4 w-4 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {tr("medical.title")}
          </h1>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
          {tr("medical.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((dog) => {
          const needsReview = dog.medicalStatus === "Needs Review";
          const statusKey = needsReview ? "medical.Needs_Review" : "medical.Healthy";
          return (
            <Link
              key={dog.id}
              href={`/medical/${dog.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <div className="relative h-32 w-full">
                <AnimalPhoto src={dog.imageUrl} alt={dog.name} sizes="320px" />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-rose-700">
                      {dog.name}
                    </p>
                    <p className="text-xs text-slate-500">{dog.breed}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      needsReview
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {tr(statusKey)}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 group-hover:text-rose-600">
                  {tr("medical.view_examination")} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          {tr("medical.compliance_esign")}
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          {tr("medical.compliance_aspca")}
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span>{tr("medical.compliance_irs")}</span>
      </div>
    </div>
  );
}
