"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AdoptCard } from "./AdoptCard";
import { useHomeLocale } from "./locale-store";
import type { Dog } from "./types";

type AdoptCardGridProps = {
  /** Adoptable animals — filtered server-side, passed down as props. */
  dogs: Dog[];
  /** Animals excluded from the public feed (behavioral evaluation). */
  excludedCount: number;
};

export function AdoptCardGrid({ dogs, excludedCount }: AdoptCardGridProps) {
  const { tr } = useHomeLocale();

  return (
    <section id="adopt" className="mx-auto max-w-6xl bg-white px-6 pb-20 pt-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        className="mb-10 flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-emerald-500" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {tr("adoption_feed.title")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            <span>{tr("adoption_feed.available", { count: dogs.length })} </span>
            {excludedCount > 0 && (
              <span className="text-amber-600">
                {tr("adoption_feed.excluded", { count: excludedCount })}{" "}
              </span>
            )}
            <span className="text-xs text-slate-600">
              ({tr("adoption_feed.compliance_note")})
            </span>
          </p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dogs.map((animal, i) => (
          <AdoptCard key={animal.id} animal={animal} index={i} tr={tr} />
        ))}
      </div>

      {dogs.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {tr("adoption_feed.empty_state")}
          </p>
        </div>
      )}
    </section>
  );
}
