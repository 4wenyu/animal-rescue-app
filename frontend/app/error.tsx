"use client";

/**
 * Root error boundary — catches uncaught render errors anywhere in the
 * app shell. Shows a calm, on-brand recovery card with a "Try again"
 * reset and a link home (Sprint D quality floor).
 */

import { useEffect } from "react";
import Link from "next/link";
import { PawPrint, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
        <PawPrint className="h-7 w-7 text-rose-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">
        We hit an unexpected error while loading this page. Your data is safe —
        try again, or head back home.
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
          Back to home
        </Link>
      </div>
    </main>
  );
}
