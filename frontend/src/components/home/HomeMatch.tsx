"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Footprints,
  House,
  Moon,
  Mountain,
  PawPrint,
  Trees,
  User,
  Users,
} from "lucide-react";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";
import { PlayChoice, PlayProgress, PlayStep } from "./HomeMatchPlay";
import { useHomeLocale } from "./locale-store";
import { matchHome, type Household, type Pace, type Space } from "./matchHome";
import type { Dog } from "./types";

const PACE: { id: Pace; key: string; icon: typeof Moon }[] = [
  { id: "calm", key: "play.pace_calm", icon: Moon },
  { id: "walks", key: "play.pace_walks", icon: Footprints },
  { id: "trail", key: "play.pace_trail", icon: Mountain },
];
const SPACE: { id: Space; key: string; icon: typeof Moon }[] = [
  { id: "apt", key: "play.space_apt", icon: Building2 },
  { id: "house", key: "play.space_house", icon: House },
  { id: "yard", key: "play.space_yard", icon: Trees },
];
const HOME: { id: Household; key: string; icon: typeof Moon }[] = [
  { id: "solo", key: "play.home_solo", icon: User },
  { id: "kids", key: "play.home_kids", icon: Users },
  { id: "pets", key: "play.home_pets", icon: PawPrint },
];

export function HomeMatch({
  dogs,
  compact = false,
  onComplete,
}: {
  dogs: Dog[];
  compact?: boolean;
  onComplete?: (matches: Dog[]) => void;
}) {
  const { tr } = useHomeLocale();
  const [pace, setPace] = useState<Pace | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);

  const answers = pace && space && household ? { pace, space, household } : null;
  const matches = answers ? matchHome(dogs, answers) : [];
  const done = Boolean(answers);
  const step: 1 | 2 | 3 = !pace ? 1 : !space ? 2 : 3;

  function reset() {
    setPace(null);
    setSpace(null);
    setHousehold(null);
  }

  function pickHousehold(id: Household) {
    setHousehold(id);
    if (pace && space) {
      onComplete?.(matchHome(dogs, { pace, space, household: id }));
    }
  }

  return (
    <section
      id="play"
      className={compact ? "scroll-mt-24" : "mx-auto max-w-6xl scroll-mt-24 px-6 pb-16"}
      aria-labelledby={compact ? undefined : "home-match-title"}
      aria-label={compact ? tr("play.title") : undefined}
    >
      <div className={compact ? "p-6 sm:p-8" : "rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 sm:p-8"}>
        {compact ? null : (
          <>
            <h2 id="home-match-title" className="text-lg font-bold text-slate-900">
              {tr("play.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              {tr("play.body")}
            </p>
          </>
        )}

        {done ? (
          <div className={compact ? "" : "mt-6"}>
            <div className="grid gap-4 sm:grid-cols-2">
              {matches.map((dog) => (
                <Link
                  key={dog.id}
                  href={`/adopt/${dog.id}`}
                  className="group overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="relative h-36 w-full overflow-hidden">
                    <AnimalPhoto src={dog.imageUrl} alt={dog.name} sizes="(max-width: 640px) 100vw, 40vw" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-slate-900">{dog.name}</p>
                    <p className="text-xs text-slate-500">{tr(`breeds.${dog.breed}`)}</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-700">
                      {tr("play.meet", { name: dog.name })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={reset}
              className="mt-5 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              {tr("play.again")}
            </button>
          </div>
        ) : (
          <>
            <PlayProgress step={step} label={tr("play.progress", { n: step })} />
            {!pace ? (
              <PlayStep prompt={tr("play.q_pace")}>
                {PACE.map((o) => (
                  <PlayChoice key={o.id} icon={o.icon} label={tr(o.key)} onPick={() => setPace(o.id)} />
                ))}
              </PlayStep>
            ) : null}
            {pace && !space ? (
              <PlayStep prompt={tr("play.q_space")}>
                {SPACE.map((o) => (
                  <PlayChoice key={o.id} icon={o.icon} label={tr(o.key)} onPick={() => setSpace(o.id)} />
                ))}
              </PlayStep>
            ) : null}
            {pace && space && !household ? (
              <PlayStep prompt={tr("play.q_home")}>
                {HOME.map((o) => (
                  <PlayChoice key={o.id} icon={o.icon} label={tr(o.key)} onPick={() => pickHousehold(o.id)} />
                ))}
              </PlayStep>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
