"use client";

/**
 * (main) route-group error boundary — staff surfaces. Renders inside the
 * (main) layout (sidebar stays), with a calm retry card.
 */

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[main/error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
        <span className="text-rose-500">⚠</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        This area hit an error
      </h1>
      <p className="max-w-md text-sm text-slate-500">
        We couldn&rsquo;t load this page. Your data is safe — try again.
      </p>
      {error?.digest && (
        <p className="font-mono text-[10px] text-slate-400">
          error digest: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
