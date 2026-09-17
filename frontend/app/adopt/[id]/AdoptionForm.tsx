/**
 * AdoptionForm — inline adopt/foster application form.
 *
 * The success/error feedback is a `role="status"` region so assistive
 * tech announces submission results, and the form can be dismissed via
 * the header ✕ button. Contact fields carry autocomplete hints.
 */

import { Send, X } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import { trWithFallback } from "./adoptI18nFallback";
import type { Dog, FormStatus, InterestType } from "./adoptTypes";

export function AdoptionForm({
  animal,
  interestType,
  status,
  submitting,
  onClose,
  onSubmit,
}: {
  animal: Dog;
  interestType: InterestType;
  status: FormStatus;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { tr } = useI18n();
  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">
          {interestType === "ADOPT"
            ? tr("adopt.apply_to_adopt", { name: animal.name })
            : tr("adopt.apply_to_foster", { name: animal.name })}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={trWithFallback(tr, "adopt.form_close")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-500">{tr("adopt.apply_note")}</p>
      <div role="status">
        {status === "success" && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {tr("adopt.form_success")}
          </p>
        )}
        {status === "error" && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {tr("adopt.form_error")}
          </p>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">
              {tr("adopt.form_name")} *
            </span>
            <input
              name="fullName"
              required
              minLength={2}
              autoComplete="name"
              placeholder={tr("adopt.form_name_ph")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">
              {tr("adopt.form_email")} *
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            {tr("adopt.form_phone")}
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={tr("adopt.form_phone_ph")}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            {tr("adopt.form_message")}
          </span>
          <textarea
            name="message"
            rows={3}
            placeholder={tr("adopt.form_message_ph")}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? tr("adopt.form_submitting") : tr("adopt.form_submit")}
        </button>
      </form>
    </div>
  );
}
