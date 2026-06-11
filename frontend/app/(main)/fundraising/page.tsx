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
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Fundraising Campaigns
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Select an animal to view or contribute to its funding campaign.
          All donations are tracked with legal restriction flags to prevent
          fund mixing.
        </p>
      </div>

      <div className="space-y-2">
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
              className="block rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-neutral-800">
                    {campaign.id}
                  </span>
                  <span className="text-neutral-400">{campaign.species}</span>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isComplete ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {formatCurrency(campaign.raised)} /{" "}
                  {formatCurrency(campaign.goal)}
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    isComplete ? "bg-green-400" : "bg-blue-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
                <span>{Math.round(progressPct)}% funded</span>
                {isComplete && (
                  <span className="font-semibold text-green-600">
                    &#x2713; Goal reached
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-neutral-400">
        Showing {RECENT_CAMPAIGNS.length} active campaigns. A full list will
        be available once the database is connected.
      </p>
    </div>
  );
}