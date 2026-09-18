"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { Dog } from "@/src/components/home/types";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { useI18n } from "@/src/lib/useI18n";

type Campaign = Dog & { raised: number; goal: number };

export function FundraisingList({ campaigns }: { campaigns: Campaign[] }) {
  const { tr } = useI18n();
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {tr("fundraising.title")}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {tr("fundraising.subtitle")}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr("fundraising.back_to_dashboard")}
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const progressPct = Math.min((campaign.raised / campaign.goal) * 100, 100);
          const isComplete = campaign.raised >= campaign.goal;
          return (
            <Link
              key={campaign.id}
              href={`/fundraising/${campaign.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="relative h-28 w-full">
                <AnimalPhoto src={campaign.imageUrl} alt={campaign.name} sizes="320px" />
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{campaign.name}</h2>
                    <p className="text-xs text-slate-400">{campaign.breed}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">
                    {currency.format(campaign.raised)} / {currency.format(campaign.goal)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${isComplete ? "bg-emerald-400" : "bg-emerald-500"}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-emerald-600">
                  {tr("fundraising.donate_cta")} →
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
