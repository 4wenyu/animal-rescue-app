/**
 * ShareProgressPanel — honest progress toward the free-search milestone.
 *
 * Everything rendered comes from the API: shares are PENDING until a
 * reviewer marks them VERIFIED, so the bar honestly sits at 0 until then.
 * Once the milestone is met, the claim-state machine renders here.
 */

import { Check, Loader2 } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { GrantState, ShareProgress } from "./shareTypes";

export function ShareProgressPanel({
  progress,
  grant,
  onClaim,
}: {
  progress: ShareProgress;
  grant: GrantState;
  onClaim: () => void;
}) {
  const { tr } = useI18n();
  const pct = Math.min(
    100,
    Math.round((progress.verified / progress.milestone) * 100),
  );
  const progressLabel = tr("radar.share_progress", {
    verified: String(progress.verified),
    milestone: String(progress.milestone),
  });

  return (
    <div className="mt-5 border-t border-emerald-100 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700">{progressLabel}</p>
        <p className="text-xs font-medium text-slate-500">
          {tr("radar.share_progress_note")}
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={progress.verified}
        aria-valuemin={0}
        aria-valuemax={progress.milestone}
        aria-label={progressLabel}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.verified >= progress.milestone && (
        <div className="mt-3 space-y-2">
          {grant.status === "claimed" && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              {tr("radar.share_granted", {
                balance: String(grant.balanceAfter ?? ""),
              })}
            </p>
          )}
          {grant.status === "already" && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              {tr("radar.share_already_granted")}
            </p>
          )}
          {grant.status === "claiming" && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white opacity-70"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {tr("radar.share_claiming")}
            </button>
          )}
          {(grant.status === "idle" || grant.status === "error") && (
            <button
              type="button"
              onClick={onClaim}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98]"
            >
              <Check className="h-3.5 w-3.5" />
              {tr("radar.share_claim")}
            </button>
          )}
          {grant.status === "error" && (
            <p className="text-xs font-medium text-rose-600">{grant.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
