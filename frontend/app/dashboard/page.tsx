"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  PawPrint,
  HeartPulse,
  Dog,
  Stethoscope,
  Calendar,
  ShieldCheck,
  Syringe,
  Activity,
  Users,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import dogs from "../../data/dogs.json";
import { PremiumStatCard } from "@/src/components/dashboard/PremiumStatCard";
import { AnimalTable } from "@/src/components/dashboard/AnimalTable";

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
};

export default function Dashboard() {
  const [filter, setFilter] = useState<string | null>(null);
  const dogsTyped = dogs as Dog[];
  const totalDogs = dogsTyped.length;
  const healthyCount = dogsTyped.filter((d) => d.medicalStatus === "Healthy").length;
  const needsReviewCount = dogsTyped.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = (dogsTyped.reduce((s, d) => s + d.age, 0) / totalDogs).toFixed(1);

  const healthyTrend = Math.round(((healthyCount - 248) / 248) * 100);
  const reviewTrend = -Math.round(((48 - needsReviewCount) / 48) * 100);

  const filteredDogs = useMemo(() => {
    if (!filter) return dogsTyped;
    if (filter === "Needs Review") {
      return dogsTyped.filter((d) => d.medicalStatus === "Needs Review");
    }
    if (filter === "Healthy") {
      return dogsTyped.filter((d) => d.medicalStatus === "Healthy");
    }
    if (filter === "Total Dogs") {
      return dogsTyped; // total — just show all
    }
    return dogsTyped;
  }, [filter, dogsTyped]);

  const stats = [
    {
      label: "Total Dogs",
      value: totalDogs,
      icon: PawPrint,
      accentColor: "#533afd",
      trend: 8,
      filterKey: "Total Dogs",
    },
    {
      label: "Healthy",
      value: healthyCount,
      icon: HeartPulse,
      accentColor: "#15be53",
      trend: healthyTrend,
      filterKey: "Healthy",
    },
    {
      label: "Needs Review",
      value: needsReviewCount,
      icon: AlertTriangle,
      accentColor: "#ea2261",
      trend: reviewTrend,
      filterKey: "Needs Review",
    },
    {
      label: "Avg. Age",
      value: `${avgAge} yrs`,
      icon: Users,
      accentColor: "#533afd",
      filterKey: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Header ───────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 pt-0"
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Triage Dashboard
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <PawPrint className="h-3.5 w-3.5 text-slate-400" />
                Active Roster · {totalDogs} animals
              </span>
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="ml-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Clear filter: {filter}
                </button>
              )}
            </p>
          </div>
          <Link
            href="/intake/public"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 active:scale-[0.97]"
          >
            <PawPrint className="h-4 w-4" />
            Add Animal
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.header>

      {/* ── Stat Cards — clickable to filter the table ──────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            onClick={() => {
              // "Total Dogs" and non-filterable cards just show all
              // "Total Dogs" and non-filterable cards clear all filters
              if (stat.filterKey === "Total Dogs" || stat.filterKey === null) {
                setFilter(null);
              } else {
                setFilter(stat.filterKey === filter ? null : stat.filterKey);
              }
            }}
            className={stat.filterKey ? "cursor-pointer" : ""}
            title={stat.filterKey ? `Filter: ${stat.filterKey}` : undefined}
          >
            <PremiumStatCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              accentColor={stat.accentColor}
              trend={stat.trend}
              totalDogs={totalDogs}
              delay={i * 0.07}
            />
          </div>
        ))}
      </div>

      {/* ── Triage Table ────────────────────────────────────── */}
      <AnimalTable dogs={filteredDogs} onViewAll={() => setFilter(null)} />

      {/* ── Footer — no overlap, clean spacing ──────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 pb-8 text-center text-xs text-slate-400"
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          RescueHub · Triage System · v3.5
        </span>
      </motion.p>
    </div>
  );
}