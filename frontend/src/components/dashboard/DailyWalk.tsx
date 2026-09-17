"use client";

import { useCallback, useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { HomeMatch } from "@/src/components/home/HomeMatch";
import type { Dog } from "@/src/components/home/types";
import { useI18n } from "@/src/lib/useI18n";
import { rememberMet } from "./rememberMet";
import {
  bumpWalkStreak,
  readWalkStreak,
  toYmd,
  yesterdayYmd,
  type WalkStreak,
} from "./walkStreak";

export function DailyWalk({
  dogs,
  tomorrowBreed,
  onMet,
}: {
  dogs: Dog[];
  tomorrowBreed?: string;
  onMet?: (ids: number[]) => void;
}) {
  const { tr } = useI18n();
  const [streak, setStreak] = useState<WalkStreak | null>(null);

  useEffect(() => {
    setStreak(readWalkStreak());
  }, []);

  const walkedToday = streak?.lastYmd === toYmd(new Date());
  const streakAlive = Boolean(
    streak && (walkedToday || streak.lastYmd === yesterdayYmd()),
  );
  const days = streakAlive && streak ? streak.days : 0;

  const onComplete = useCallback(
    (matched: Dog[]) => {
      setStreak(bumpWalkStreak());
      onMet?.(rememberMet(matched.map((d) => d.id)));
    },
    [onMet],
  );

  const playDogs = dogs.filter(
    (d) => d.euthanasia_risk_status !== "IMMEDIATE_BEHAVIORAL",
  );

  return (
    <section
      aria-labelledby="kennel-walk-title"
      className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 bg-emerald-50/80 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            {tr("dashboard.walk_kicker")}
          </p>
          <h2 id="kennel-walk-title" className="text-lg font-bold text-slate-900">
            {tr("play.title")}
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {walkedToday
              ? tr("dashboard.walk_today_done")
              : days > 0
                ? tr("dashboard.walk_streak", { count: days })
                : tr("dashboard.walk_streak_zero")}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-sm font-bold text-emerald-800 shadow-sm">
          <PawPrint className="h-4 w-4" aria-hidden="true" />
          {days > 0
            ? tr("dashboard.walk_day", { count: days })
            : tr("dashboard.walk_day_zero")}
        </span>
      </div>
      {walkedToday && tomorrowBreed ? (
        <div className="mx-6 mt-5 flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
          <span className="h-12 w-12 shrink-0 rounded-xl bg-slate-700" aria-hidden="true" />
          <p className="text-sm font-medium">
            {tr("today.tomorrow", { breed: tr(`breeds.${tomorrowBreed}`) })}
          </p>
        </div>
      ) : null}
      <HomeMatch compact dogs={playDogs} onComplete={onComplete} />
    </section>
  );
}
