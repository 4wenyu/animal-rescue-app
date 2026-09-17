/**
 * SearchStatusStepper — 3-step progress track for /radar/[searchId].
 *
 * CANCELLED searches exit the track: they stop at "Not found" (shown in a
 * distinct neutral state) and never advance into the final "Closed" step,
 * whose marker renders as a muted ✕ instead of a reached check or a bare
 * number.
 */

import { CheckCircle2, X } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { SearchStatus } from "./types";

export function SearchStatusStepper({ status }: { status: SearchStatus }) {
  const { tr } = useI18n();
  const cancelled = status === "CANCELLED";
  const steps: {
    key: SearchStatus;
    label: string;
    reached: boolean;
    exited: boolean;
  }[] = [
    {
      key: "SEARCHING",
      label: tr("radar.step_activated"),
      reached: true,
      exited: false,
    },
    {
      key: "FOUND",
      label: cancelled
        ? tr("radar.step_not_found")
        : tr("radar.step_found"),
      reached: status === "FOUND" || cancelled,
      exited: false,
    },
    {
      // A cancelled search never reaches the final step — it exits the
      // track at "Not found" with a distinct cancelled marker instead.
      key: "CANCELLED",
      label: tr("radar.step_closed"),
      reached: status === "FOUND",
      exited: cancelled,
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step.reached
                    ? step.key === "FOUND" && cancelled
                      ? "bg-slate-400 text-white"
                      : "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.reached ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : step.exited ? (
                  <X className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step.reached ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  steps[i + 1].reached ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
