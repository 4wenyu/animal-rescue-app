/**
 * RadarErrorStates — loading and load-failure cards for /radar/[searchId].
 *
 * The route always exists for any searchId; a missing/failed search renders
 * the graceful error card instead of a 404.
 */

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/src/lib/useI18n";

export function RadarLoadErrorCard({ error }: { error: string }) {
  const { tr } = useI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {tr("radar.back_to_dashboard")}
      </Link>
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-base font-semibold text-rose-700">
          {tr("radar.load_error_title")}
        </p>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      </div>
    </div>
  );
}

export function RadarLoadingCard() {
  const { tr } = useI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm font-medium">{tr("radar.loading")}</p>
        </div>
      </div>
    </div>
  );
}
