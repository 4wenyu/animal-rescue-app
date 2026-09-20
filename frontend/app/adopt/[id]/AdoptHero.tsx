/**
 * AdoptHero — photo-led hero for the adopter-facing profile: availability
 * badge ("Still available" / "On hold"), name and breed over the photo.
 */

import { useI18n } from "@/src/lib/useI18n";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";

import type { Dog } from "./adoptTypes";

export function AdoptHero({
  animal,
  available,
}: {
  animal: Dog;
  available: boolean;
}) {
  const { tr } = useI18n();
  return (
    <div className="relative h-80 w-full bg-slate-100 sm:h-96">
      <AnimalPhoto
        src={animal.imageUrl}
        alt={animal.name}
        priority
        roundedClassName=""
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm">
          {available ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {tr("adoption_feed.still_available")}
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {tr("adoption_feed.on_hold")}
            </>
          )}
        </span>
        <h1 className="mt-2 text-4xl font-bold text-white drop-shadow-sm">
          {tr("adoption_feed.meet_name", { name: animal.name })}
        </h1>
        <p className="mt-1 text-sm font-medium text-white/90">
          {tr(`breeds.${animal.breed}`)}
        </p>
      </div>
    </div>
  );
}
