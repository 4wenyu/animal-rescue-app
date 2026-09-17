"use client";

import Link from "next/link";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { ShareToday } from "@/src/components/home/ShareToday";
import { useHomeLocale } from "./locale-store";
import type { Dog } from "./types";

export function TodayAnimal({
  dog,
  tomorrowBreed,
  compact = false,
}: {
  dog: Dog;
  tomorrowBreed?: string;
  compact?: boolean;
}) {
  const { tr } = useHomeLocale();

  return (
    <section
      className={compact ? "mb-8" : "mx-auto max-w-6xl px-6 pb-12"}
      aria-labelledby="today-animal-title"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        {tr("today.kicker")}
      </p>
      <div className="mt-3 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm sm:flex">
        <Link
          href={`/adopt/${dog.id}`}
          className="relative block h-56 w-full shrink-0 sm:h-auto sm:w-56"
        >
          <AnimalPhoto src={dog.imageUrl} alt={dog.name} sizes="224px" />
        </Link>
        <div className="p-6">
          <h2 id="today-animal-title" className="text-xl font-bold text-slate-900">
            {tr("today.title", { name: dog.name })}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{tr(`breeds.${dog.breed}`)}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {tr("today.body")}
          </p>
          {tomorrowBreed ? (
            <p className="mt-3 text-sm font-medium text-emerald-800">
              {tr("today.tomorrow", { breed: tr(`breeds.${tomorrowBreed}`) })}
            </p>
          ) : null}
          <ShareToday name={dog.name} />
        </div>
      </div>
    </section>
  );
}
