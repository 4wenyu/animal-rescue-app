"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AnimalTable } from "@/src/components/dashboard/AnimalTable";
import { DailyWalk } from "@/src/components/dashboard/DailyWalk";
import { DashboardHeader } from "@/src/components/dashboard/DashboardHeader";
import { MetAlbum } from "@/src/components/dashboard/MetAlbum";
import { MySearches } from "@/src/components/dashboard/MySearches";
import { RosterStats } from "@/src/components/dashboard/RosterStats";
import {
  SponsorshipCheckoutModal,
  type SearchGrantSuccess,
} from "@/src/components/dashboard/SponsorshipCheckoutModal";
import { TodayBoard } from "@/src/components/dashboard/TodayBoard";
import { TokenWalletCardClient } from "@/src/components/dashboard/TokenWalletCard.client";
import { readMetIds } from "@/src/components/dashboard/rememberMet";
import { TodayAnimal } from "@/src/components/home/TodayAnimal";
import type { Dog } from "@/src/components/home/types";
import { useI18n } from "@/src/lib/useI18n";

export function DashboardView({
  displayName,
  dogs,
  reviewCount,
  staff,
  todayDog,
  tomorrowBreed,
}: {
  displayName: string;
  dogs: Dog[];
  reviewCount: number;
  staff: boolean;
  todayDog: Dog | null;
  tomorrowBreed: string;
}) {
  const router = useRouter();
  const { tr } = useI18n();
  const [filter, setFilter] = useState<string | null>(null);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [metIds, setMetIds] = useState<number[]>([]);

  useEffect(() => {
    setMetIds(readMetIds());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tokens/wallet", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.wallet) setWalletBalance(j.wallet.cachedBalance);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onSearchGranted = useCallback(
    (result: SearchGrantSuccess) => {
      window.dispatchEvent(new Event("tokenwallet:refresh"));
      router.push(
        `/lost-pet-intake?credit=${encodeURIComponent(result.creditTxnId)}` +
          `&spend=${encodeURIComponent(result.spendTxnId)}` +
          `&newBalance=${encodeURIComponent(String(result.newBalance))}`,
      );
    },
    [router],
  );

  const filteredDogs = useMemo(() => {
    if (filter === "Needs Review") return dogs.filter((d) => d.medicalStatus === "Needs Review");
    if (filter === "Healthy") return dogs.filter((d) => d.medicalStatus === "Healthy");
    return dogs;
  }, [filter, dogs]);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        displayName={displayName}
        totalDogs={dogs.length}
        staff={staff}
        filter={filter}
        onClearFilter={() => setFilter(null)}
        onFindPet={() => setSponsorModalOpen(true)}
      />
      <TodayBoard
        reviewCount={reviewCount}
        staff={staff}
        onSearch={() => setSponsorModalOpen(true)}
      />
      {todayDog ? (
        <TodayAnimal compact dog={todayDog} tomorrowBreed={tomorrowBreed} />
      ) : null}
      <DailyWalk dogs={dogs} tomorrowBreed={tomorrowBreed} onMet={setMetIds} />
      <MetAlbum dogs={dogs} metIds={metIds} />
      <section className="mb-8">
        <TokenWalletCardClient />
      </section>
      <div className="mb-8">
        <MySearches />
      </div>
      {staff ? (
        <>
          <RosterStats dogs={dogs} filter={filter} onFilter={setFilter} />
          <AnimalTable dogs={filteredDogs} onViewAll={() => setFilter(null)} />
        </>
      ) : null}
      <p className="mt-10 pb-8 text-center text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          {tr("dashboard.v3")}
        </span>
      </p>
      <SponsorshipCheckoutModal
        open={sponsorModalOpen}
        currentBalance={walletBalance}
        onClose={() => setSponsorModalOpen(false)}
        onSearchGranted={onSearchGranted}
      />
    </div>
  );
}
