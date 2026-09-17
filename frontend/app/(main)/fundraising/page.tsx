"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

/** Placeholder data — replace with Prisma query in production. */
const RECENT_CAMPAIGNS = [
  { id: "DOG-A001", species: "Dog", goal: 1500, raised: 875 },
  { id: "CAT-B042", species: "Cat", goal: 1500, raised: 1500 },
  { id: "VET-D003", species: "Dog", goal: 5000, raised: 2100 },
];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents);
}

export default function FundraisingPage() {
  const { tr } = useI18n();

  return (
    <div className="space-y-6">
      {/* ── Header with back button ─────────────────────────── */}
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
          {tr("fundraising.back_to_dashboard")}
        </Link>
      </div>

      {/* ── Campaign cards ──────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {RECENT_CAMPAIGNS.map((campaign) => {
          const progressPct = Math.min(
            (campaign.raised / campaign.goal) * 100,
            100,
          );
          const isComplete = campaign.raised >= campaign.goal;

          return (
            <Link
              key={campaign.id}
              href={`/fundraising/${campaign.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {campaign.id}
                  </h3>
                  <p className="text-xs text-slate-400">{campaign.species}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isComplete ? "text-emerald-600" : "text-slate-600"
                  }`}
                >
                  {formatCurrency(campaign.raised)} /{" "}
                  {formatCurrency(campaign.goal)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-emerald-400" : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {tr("fundraising.percent_funded", {
                    pct: Math.round(progressPct).toString(),
                  })}
                </span>
                {isComplete ? (
                  <span className="font-semibold text-emerald-600">
                    {tr("fundraising.goal_reached")}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    {tr("fundraising.donate_cta")}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Footer note ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs leading-relaxed text-slate-400">
          {tr("fundraising.showing_count", { count: RECENT_CAMPAIGNS.length })}
        </p>
      </div>
    </div>
  );
}
