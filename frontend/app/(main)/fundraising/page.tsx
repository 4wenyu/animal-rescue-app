import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fundraising Campaigns — RescueHub",
  description:
    "View and donate to fundraising campaigns for animals in the shelter.",
};

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

export default function FundraisingPage(): ReactNode {
  return (
    <div className="space-y-6">
      {/* ── Header with back button ─────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fundraising Campaigns
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Support the animals in our care. Every donation is tracked with
            legal restriction flags to prevent fund mixing.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          ← Back to Dashboard
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
                  {Math.round(progressPct)}% funded
                </span>
                {isComplete ? (
                  <span className="font-semibold text-emerald-600">
                    ✓ Goal reached
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600 opacity-0 transition group-hover:opacity-100">
                    Donate →
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
          Showing {RECENT_CAMPAIGNS.length} active campaigns. A full list will
          be available once the database is connected. All transactions comply
          with the Charleston Principles for internet-based charitable
          fundraising.
        </p>
      </div>
    </div>
  );
}