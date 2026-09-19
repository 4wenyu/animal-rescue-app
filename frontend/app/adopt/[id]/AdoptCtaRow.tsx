"use client";

import { CalendarClock, Heart, Home, Mail, Share2 } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/src/lib/useI18n";

import { trWithFallback } from "./adoptI18nFallback";
import type { Dog, InterestType } from "./adoptTypes";

export function AdoptCtaRow({
  animal,
  available,
  onStartApplication,
  onShare,
}: {
  animal: Dog;
  available: boolean;
  onStartApplication: (type: InterestType) => void;
  onShare?: () => void;
}) {
  const { tr } = useI18n();
  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        disabled={!available}
        onClick={() => onStartApplication("ADOPT")}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Home className="h-4 w-4" />
        {tr("adoption_feed.adopt")} {animal.name}
      </button>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={!available}
          onClick={() => onStartApplication("FOSTER")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-50"
        >
          <Heart className="h-4 w-4" />
          {tr("adoption_feed.foster")}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Share2 className="h-4 w-4" />
          {tr("adopt.share", { name: animal.name })}
        </button>
        <Link
          href={`/fundraising/${animal.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Heart className="h-4 w-4" />
          {tr("adoption_feed.donate")}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => onStartApplication("CONTACT")}
        className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        <Mail className="h-4 w-4" />
        {tr("adoption_feed.contact_shelter")}
      </button>
      {!available && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {trWithFallback(tr, "adopt.hold_cta_note", { name: animal.name })}
        </p>
      )}
    </div>
  );
}
