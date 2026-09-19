"use client";

import { useEffect, useState } from "react";
import { useHomeLocale } from "@/src/components/home/locale-store";
import { bumpWalkStreak } from "@/src/components/dashboard/walkStreak";

export function StayLoopBanner({ name }: { name: string }) {
  const { tr } = useHomeLocale();
  const [days, setDays] = useState(1);

  useEffect(() => {
    setDays(bumpWalkStreak().days);
  }, []);

  return (
    <p className="mt-4 text-sm font-medium text-emerald-800">
      {days > 1
        ? tr("stay.streak", { days, name })
        : tr("stay.streak_start", { name })}
    </p>
  );
}
