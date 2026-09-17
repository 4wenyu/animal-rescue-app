"use client";

import { AlertTriangle, HeartPulse, PawPrint, Users } from "lucide-react";
import { PremiumStatCard } from "@/src/components/dashboard/PremiumStatCard";
import { useI18n } from "@/src/lib/useI18n";
import type { Dog } from "@/src/components/home/types";

export function RosterStats({
  dogs,
  filter,
  onFilter,
}: {
  dogs: Dog[];
  filter: string | null;
  onFilter: (next: string | null) => void;
}) {
  const { tr } = useI18n();
  const total = dogs.length;
  const healthy = dogs.filter((d) => d.medicalStatus === "Healthy").length;
  const review = dogs.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = total === 0 ? "0" : (dogs.reduce((s, d) => s + d.age, 0) / total).toFixed(1);

  const stats = [
    {
      label: tr("dashboard.stats.total_dogs"),
      value: total,
      icon: PawPrint,
      accentColor: "#059669",
      meta: tr("dashboard.stats.of_total", { count: total }),
      filterKey: null as string | null,
    },
    {
      label: tr("dashboard.stats.healthy"),
      value: healthy,
      icon: HeartPulse,
      accentColor: "#15be53",
      meta: tr("dashboard.stats.of_total", { count: total }),
      filterKey: "Healthy",
    },
    {
      label: tr("dashboard.stats.needs_review"),
      value: review,
      icon: AlertTriangle,
      accentColor: "#ea2261",
      meta: tr("dashboard.stats.of_total", { count: total }),
      filterKey: "Needs Review",
    },
    {
      label: tr("dashboard.stats.avg_age"),
      value: `${avgAge} ${tr("dashboard.stats.yrs")}`,
      icon: Users,
      accentColor: "#059669",
      meta: tr("dashboard.stats.across_all"),
      filterKey: null,
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          role={stat.filterKey ? "button" : undefined}
          tabIndex={stat.filterKey ? 0 : undefined}
          onClick={() => {
            if (!stat.filterKey) {
              onFilter(null);
              return;
            }
            onFilter(stat.filterKey === filter ? null : stat.filterKey);
          }}
          onKeyDown={(e) => {
            if (!stat.filterKey) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onFilter(stat.filterKey === filter ? null : stat.filterKey);
            }
          }}
          className={stat.filterKey ? "cursor-pointer" : undefined}
        >
          <PremiumStatCard
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            accentColor={stat.accentColor}
            totalDogs={total}
            meta={stat.meta}
            delay={i * 0.07}
          />
        </div>
      ))}
    </div>
  );
}
