"use client";

/**
 * Lost-pet intake error boundary.
 *
 * This is the product's most emotionally loaded surface — someone has just
 * lost a pet. A blank screen here reads as "the site lost my report", so the
 * copy leads with reassurance and offers a path that does not need the chat
 * agent (which depends on a paid AI provider that can fail independently).
 */

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function LostPetIntakeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[lost-pet-intake/error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
        <span className="text-amber-600">⚠</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">
        We couldn&rsquo;t load the intake assistant
      </h1>
      <p className="text-sm leading-relaxed text-slate-600">
        This is on us, not you — and nothing you typed was lost from our side.
        Please try again. If it keeps failing, you can still report your pet
        through the intake portal and a person will pick it up.
      </p>
      {error?.digest && (
        <p className="font-mono text-[10px] text-slate-600">
          error digest: {error.digest}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/intake/public"
          className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Use the intake portal
        </Link>
      </div>
    </div>
  );
}
