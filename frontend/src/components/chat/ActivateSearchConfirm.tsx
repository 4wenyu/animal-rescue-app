"use client";

import { Loader2, Rocket, X } from "lucide-react";

type Field = { label: string; value?: string };

/**
 * Intent preview before a lost-pet search spends the token credit.
 */
export function ActivateSearchConfirm({
  open,
  fields,
  fee,
  activating,
  onConfirm,
  onClose,
  t,
}: {
  open: boolean;
  fields: Field[];
  fee: number;
  activating: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-search-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="activate-search-title"
            className="text-lg font-bold text-slate-900"
          >
            {t("chatIntake.confirm_title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t("chatIntake.confirm_back")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {t("chatIntake.confirm_body", { fee: String(fee) })}
        </p>
        <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
          {fields.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 text-sm">
              <dt className="text-slate-500">{f.label}</dt>
              <dd className="max-w-[60%] text-right font-medium text-slate-900">
                {f.value?.trim() ? f.value : "—"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-slate-500">
          {t("chatIntake.confirm_fee_note")}
        </p>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={activating}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {t("chatIntake.confirm_back")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={activating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 disabled:opacity-70"
          >
            {activating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {activating
              ? t("chatIntake.activating_label")
              : t("chatIntake.confirm_start")}
          </button>
        </div>
      </div>
    </div>
  );
}
