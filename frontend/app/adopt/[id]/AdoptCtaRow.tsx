/**
 * AdoptCtaRow — always-visible CTA row: Adopt / Foster / Donate / Contact.
 *
 * While the animal is on statutory hold the Adopt/Foster CTAs are
 * disabled and a short explanatory note is shown; Donate and Contact the
 * shelter stay available.
 */

import { ArrowRight, Heart, Home, Mail } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/src/lib/useI18n";

import { trWithFallback } from "./adoptI18nFallback";
import type { Dog, InterestType } from "./adoptTypes";

export function AdoptCtaRow({
  animal,
  available,
  onStartApplication,
}: {
  animal: Dog;
  available: boolean;
  onStartApplication: (type: InterestType) => void;
}) {
  const { tr } = useI18n();
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        disabled={!available}
        onClick={() => onStartApplication("ADOPT")}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
      >
        <Home className="h-4 w-4" />
        {tr("adoption_feed.adopt")} {animal.name}
        <ArrowRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!available}
        onClick={() => onStartApplication("FOSTER")}
        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
      >
        <Heart className="h-4 w-4" />
        {tr("adoption_feed.foster")} {animal.name}
      </button>
      <Link
        href={`/fundraising/${animal.id}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 active:scale-[0.98]"
      >
        <Heart className="h-4 w-4" />
        {tr("adoption_feed.donate")}
      </Link>
      <a
        href={`mailto:adopt@rescuehub.org?subject=${encodeURIComponent(
          `Interested in ${animal.name} (${animal.id})`,
        )}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
      >
        <Mail className="h-4 w-4" />
        {tr("adoption_feed.contact_shelter")}
      </a>
      {!available && (
        <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">
          {trWithFallback(tr, "adopt.hold_cta_note", { name: animal.name })}
        </p>
      )}
    </div>
  );
}
