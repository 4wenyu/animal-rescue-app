"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import type { Dog } from "./types";

export function FeaturedAnimalCard({
  featured,
  breedLabel,
  className,
}: {
  featured: Dog;
  breedLabel: string;
  className?: string;
}) {
  if (!featured.imageUrl) return null;

  return (
    <Link
      href={`/adopt/${featured.id}`}
      className={`group block overflow-hidden rounded-3xl border-4 border-white/70 bg-white shadow-2xl shadow-emerald-900/20 backdrop-blur-sm transition hover:scale-[1.02] hover:shadow-emerald-900/30 ${className ?? ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <AnimalPhoto
          src={featured.imageUrl}
          alt={featured.name}
          priority
          roundedClassName=""
          className="transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1023px) 40vw, 288px"
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{featured.name}</p>
          <p className="text-xs text-slate-600">{breedLabel}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-emerald-500 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
