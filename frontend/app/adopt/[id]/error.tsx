"use client";

/**
 * /adopt route-group error boundary — adopter-facing. Calm retry card
 * with a path back to the adoption feed (Sprint D quality floor).
 */

import { useEffect } from "react";
import Link from "next/link";
import { PawPrint, RefreshCw, Home } from "lucide-react";

export default function AdoptError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[adopt/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
        <PawPrint className="h-7 w-7 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">
        We couldn&rsquo;t show this pet
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">
        Something went wrong loading this adoption profile. Try again, or
        head back to the adoption listings.
      </p>
      {error?.digest && (
        <p className="font-mono text-[10px] text-slate-400">
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
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Home className="h-4 w-4" />
          Adoption listings
        </Link>
      </div>
    </div>
  );
}
