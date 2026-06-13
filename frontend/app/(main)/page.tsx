"use client";

import { motion } from "framer-motion";
import {
  PawPrint,
  Heart,
  Activity,
  Calendar,
  ShieldCheck,
  HeartPulse,
  Dog,
  Stethoscope,
} from "lucide-react";
import dogs from "../../data/dogs.json";
import { PremiumStatCard } from "@/src/components/dashboard/PremiumStatCard";

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

export default function MainDashboard() {
  const dogsTyped = dogs as Dog[];
  const totalDogs = dogsTyped.length;
  const healthyCount = dogsTyped.filter((d) => d.medicalStatus === "Healthy").length;
  const needsReviewCount = dogsTyped.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = (dogsTyped.reduce((s, d) => s + d.age, 0) / totalDogs).toFixed(1);

  const healthyTrend = Math.round(((healthyCount - 248) / 248) * 100);
  const reviewTrend = -Math.round(((48 - needsReviewCount) / 48) * 100);

  const stats = [
    { label: "Total Dogs", value: totalDogs, icon: PawPrint, accentColor: "#533afd", trend: 8 },
    { label: "Healthy", value: healthyCount, icon: HeartPulse, accentColor: "#15be53", trend: healthyTrend },
    { label: "Needs Review", value: needsReviewCount, icon: Stethoscope, accentColor: "#ea2261", trend: reviewTrend },
    { label: "Avg. Age", value: `${avgAge} yrs`, icon: Calendar, accentColor: "#533afd" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 border-b border-slate-200/60 pb-6"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <Dog className="h-4 w-4 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1">
            <PawPrint className="h-3.5 w-3.5 text-slate-400" />
            Active Roster · {totalDogs} animals
          </span>
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
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
          </motion.div>
        ))}
      </div>

      {/* Compliance badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm"
      >
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ESIGN/UETA Compliant
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-rose-400" />
          IRS § 501(c)(3)
        </span>
        <span className="h-3 w-px bg-slate-200" />
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          Charleston Principles
        </span>
      </motion.div>
    </div>
  );
}