"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, Heart } from "lucide-react";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { getAgeLabel, getDeadlineLabel, getRiskLabel } from "./adopt-labels";
import type { TranslateFn } from "./home-strings";
import type { Dog } from "./types";

type AdoptCardProps = {
  animal: Dog;
  index: number;
  tr: TranslateFn;
};

export function AdoptCard({ animal, index, tr }: AdoptCardProps) {
  const risk = getRiskLabel(animal.euthanasia_risk_status, tr);
  const deadline = getDeadlineLabel(animal, tr);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div
        className={`absolute left-0 right-0 top-0 h-1 ${
          animal.medicalStatus === "Healthy" ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />

      {/* §Step 4 — photo-first lead image */}
      <div className="relative -mx-5 -mt-5 mb-4 h-44 overflow-hidden">
        <AnimalPhoto
          src={animal.imageUrl}
          alt={animal.name}
          priority={index < 3}
          roundedClassName=""
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                {animal.name}
              </h3>
              <p className="text-sm text-slate-500 truncate">
                {tr(`breeds.${animal.breed}`)}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${risk.class}`}
            >
              {risk.text}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400">
            <span>{getAgeLabel(animal.age, tr)}</span>
            <span className="h-3 w-px bg-slate-200" />
            <span
              className={
                animal.medicalStatus === "Healthy"
                  ? "text-emerald-600"
                  : "text-amber-600"
              }
            >
              {/* Data uses "Needs Review"; dict keys are snake_cased. */}
              {tr(`medical.${animal.medicalStatus.replace(/\s+/g, "_")}`)}
            </span>
          </div>

          {/* Sex chip — honest roster attribute (review §3.4). */}
          {animal.sex && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                {animal.sex === "Female" ? tr("adopt.sex_female") : tr("adopt.sex_male")}
              </span>
            </div>
          )}

          {/* Personality blurb — one honest line, not a fabricated bio. */}
          {animal.personality && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {animal.personality}
            </p>
          )}

          {animal.euthanasia_risk_status === "AT_RISK" && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {tr("adoption_feed.at_risk_badge")}
            </div>
          )}

          {/* Sprint B — live availability + dignified deadline copy */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            {animal.statutoryHoldCleared ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {tr("adoption_feed.still_available")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                {tr("adoption_feed.on_hold")}
              </span>
            )}
            {deadline && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3 text-slate-400" />
                {deadline}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sprint B — always-visible CTA to adopter profile */}
      <Link
        href={`/adopt/${animal.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-[0.98]"
      >
        <Heart className="h-4 w-4" />
        {tr("adoption_feed.meet_name", { name: animal.name })}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
