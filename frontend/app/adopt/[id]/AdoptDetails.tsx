"use client";

import { CalendarClock, PawPrint, ShieldCheck } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { Dog } from "./adoptTypes";

function formatHomeBy(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AdoptDetails({
  animal,
  available,
  homeByDate,
}: {
  animal: Dog;
  available: boolean;
  homeByDate: string;
}) {
  const { tr, locale } = useI18n();
  const localizedDate = animal.strayHoldExpiresAt
    ? formatHomeBy(animal.strayHoldExpiresAt, locale)
    : homeByDate;
  const personality =
    tr(`personalities.${animal.name}`) === `personalities.${animal.name}`
      ? animal.personality
      : tr(`personalities.${animal.name}`);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
          <PawPrint className="h-3.5 w-3.5 text-slate-400" />
          {animal.age} {animal.age === 1 ? tr("common.year") : tr("common.years")}
        </span>
        {animal.sex && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
            {animal.sex === "Female" ? tr("adopt.sex_female") : tr("adopt.sex_male")}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            animal.medicalStatus === "Healthy"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {animal.medicalStatus === "Healthy"
            ? tr("medical.Healthy")
            : tr("medical.Needs_Review")}
        </span>
        {localizedDate && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
            {tr("adoption_feed.needs_home_by", { date: localizedDate })}
          </span>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
        {personality ? (
          <>
            <h2 className="text-sm font-bold text-slate-900">
              {tr("adopt.personality_label", { name: animal.name })}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{personality}</p>
          </>
        ) : null}
        <p className={`text-sm leading-relaxed text-slate-600 ${personality ? "mt-3" : ""}`}>
          {tr("adopt.story", { name: animal.name })}
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-900">{tr("adopt.next_steps")}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {tr("adopt.next_steps_body", { name: animal.name })}
        </p>
        {!available && localizedDate && (
          <p className="mt-3 text-xs font-medium text-slate-500">
            {tr("adopt.hold_note", { name: animal.name, date: localizedDate })}
          </p>
        )}
      </div>
    </>
  );
}
