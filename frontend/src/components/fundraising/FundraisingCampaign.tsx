"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import type { Dog } from "@/src/components/home/types";
import { FundraisingWallet } from "@/src/components/fundraising/FundraisingWallet";
import { useI18n } from "@/src/lib/useI18n";

export function FundraisingCampaign({
  dog,
  goal,
  currentBalance,
}: {
  dog: Dog;
  goal: number;
  currentBalance: number;
}) {
  const { locale, tr } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/fundraising"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
        {tr("fundraising.back_to_list")}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{dog.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{dog.breed}</p>
      </div>
      <FundraisingWallet
        rosterId={dog.id}
        animalId={String(dog.id)}
        animalName={dog.name}
        targetGoal={goal}
        currentBalance={currentBalance}
        locale={locale}
      />
    </div>
  );
}
