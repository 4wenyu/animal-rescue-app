"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Heart, Search, Shield } from "lucide-react";
import { HeroMesh } from "@/src/components/HeroMesh";
import { PawParticles } from "@/src/components/PawParticles";
import { FeaturedAnimalCard } from "./FeaturedAnimalCard";
import { AmbientToggle } from "./AmbientToggle";
import { StayLoopBanner } from "./StayLoopBanner";
import { useHomeLocale } from "./locale-store";
import type { Dog } from "./types";

const PawEmblem = dynamic(
  () => import("@/src/components/PawEmblem").then((m) => m.PawEmblem),
  { ssr: false, loading: () => null },
);

export function Hero({ featured }: { featured: Dog | null }) {
  const { tr } = useHomeLocale();

  return (
    <section className="relative flex min-h-[85svh] w-full items-center overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0 z-0">
        <HeroMesh />
        <PawParticles />
      </div>
      <div className="pointer-events-none absolute right-[3%] top-1/2 z-0 hidden -translate-y-1/2 opacity-70 xl:block">
        <PawEmblem />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:gap-12">
          {featured?.imageUrl && (
            <div className="mx-auto w-full max-w-[220px] lg:mx-0 lg:max-w-none">
              <FeaturedAnimalCard
                featured={featured}
                breedLabel={tr(`breeds.${featured.breed}`)}
              />
            </div>
          )}

          <div className="rounded-3xl border border-white/60 bg-white/70 p-6 text-center shadow-[0_0_50px_rgba(203,213,225,0.3)] backdrop-blur-xl sm:p-8 md:p-10 lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3.5 py-1 text-xs font-semibold tracking-wide text-cyan-700">
                <Shield className="h-3.5 w-3.5" />
                {tr("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 text-4xl font-bold leading-[1.15] tracking-tight text-[#334155] sm:text-5xl"
            >
              {tr("hero.headline")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#64748B] lg:mx-0"
            >
              {tr("site.description")}
            </motion.p>
            <StayLoopBanner name={featured?.name ?? "RescueHub"} />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              <Link
                href="/lost-pet-intake"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-sidebar) px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-700/25 transition hover:bg-(--color-sidebar-hover) hover:shadow-xl active:scale-[0.97]"
              >
                <Search className="h-4 w-4" />
                {tr("hero.cta_lost_pet")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#play"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-accent) px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-(--color-accent-hover) hover:shadow-xl active:scale-[0.97]"
              >
                <Heart className="h-4 w-4" />
                {tr("hero.cta_help")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <p className="mt-3 text-sm text-slate-500">{tr("hero.two_doors")}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/intake/public"
                className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                {tr("hero.cta_surrender")}
              </Link>
              <Link
                href="/fundraising"
                className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
              >
                {tr("hero.cta_crowdfunding")}
              </Link>
              <AmbientToggle />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
