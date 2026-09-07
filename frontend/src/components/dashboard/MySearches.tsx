"use client";

/**
 * My searches — Sprint A status timeline.
 * Lists the signed-in user's lost-pet searches with a live status badge and
 * a link to each /radar/[searchId]. Pulls GET /api/searches?mine=1.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Radio, CheckCircle2, X } from "lucide-react";

interface SearchSummary {
  searchId: string;
  species: string | null;
  breed: string | null;
  colorMarkings: string | null;
  lastSeen: string | null;
  status: "SEARCHING" | "FOUND" | "CANCELLED";
  activatedAt: string;
  closedAt: string | null;
}

const STATUS_UI: Record<
  SearchSummary["status"],
  { label: string; className: string; Icon: typeof Radio }
> = {
  SEARCHING: {
    label: "Searching",
    className: "bg-emerald-50 text-emerald-700",
    Icon: Radio,
  },
  FOUND: {
    label: "Found",
    className: "bg-blue-50 text-blue-700",
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
    Icon: X,
  },
};

function describe(s: SearchSummary): string {
  const parts = [s.species, s.breed, s.lastSeen].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  return parts.length ? parts.join(" · ") : "Pet details";
}

export function MySearches() {
  const [searches, setSearches] = useState<SearchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/searches?mine=1", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { ok: boolean; searches?: SearchSummary[] };
      })
      .then((j) => {
        if (!cancelled) setSearches(j.searches ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "load error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">My searches</p>
        <p className="mt-2 text-xs text-slate-400">
          Couldn&rsquo;t load searches ({error}).
        </p>
      </div>
    );
  }

  if (!searches) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">My searches</p>
        <p className="mt-2 text-xs text-slate-400">
          No lost-pet searches yet. Activate one from the dashboard to see its
          status timeline here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-900">My searches</p>
      <ul className="divide-y divide-slate-100">
        {searches.map((s) => {
          const ui = STATUS_UI[s.status];
          const Icon = ui.Icon;
          return (
            <li key={s.searchId}>
              <Link
                href={`/radar/${s.searchId}`}
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {describe(s)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {new Date(s.activatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ui.className}`}
                  >
                    <Icon className="h-3 w-3" />
                    {ui.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
