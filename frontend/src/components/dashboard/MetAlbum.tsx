"use client";

import Link from "next/link";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { useI18n } from "@/src/lib/useI18n";
import type { Dog } from "@/src/components/home/types";

export function MetAlbum({ dogs, metIds }: { dogs: Dog[]; metIds: number[] }) {
  const { tr } = useI18n();
  const met = metIds
    .map((id) => dogs.find((d) => d.id === id))
    .filter((d): d is Dog => Boolean(d));

  return (
    <section className="mb-8" aria-labelledby="met-album-title">
      <h2 id="met-album-title" className="mb-3 text-sm font-semibold text-slate-800">
        {tr("today.album_title")}
      </h2>
      {met.length === 0 ? (
        <p className="text-sm text-slate-600">{tr("today.album_empty")}</p>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-2">
          {met.map((dog) => (
            <li key={dog.id} className="w-24 shrink-0">
              <Link href={`/adopt/${dog.id}`} className="block">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl">
                  <AnimalPhoto src={dog.imageUrl} alt={dog.name} sizes="96px" />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-800">{dog.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
