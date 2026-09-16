"use client";

/**
 * Dashboard error boundary. The dashboard fans out to the wallet API, the
 * animal roster and the ledger, so a single failing dependency must degrade
 * to a retry card rather than blanking the staff home screen.
 */

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
        <span className="text-rose-500">⚠</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        The dashboard couldn&rsquo;t load
      </h1>
      <p className="max-w-md text-sm text-slate-600">
        No animal records or token balances were changed. Try again, or open a
        specific area directly.
      </p>
      {error?.digest && (
        <p className="font-mono text-[10px] text-slate-600">
          error digest: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/intake"
          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Go to intake
        </Link>
      </div>
    </div>
  );
}
