"use client";

import { motion } from "framer-motion";
import {
  PawPrint,
  Heart,
  Activity,
  Calendar,
} from "lucide-react";
import dogs from "../../data/dogs.json";
import { StatCard } from "@/src/components/dashboard/StatCard";
import { AnimalTable } from "@/src/components/dashboard/AnimalTable";
import { GlowButton } from "@/components/magic/GlowButton";

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
};

export default function Dashboard() {
  const dogsTyped = dogs as Dog[];
  const totalDogs = dogsTyped.length;
  const healthyCount = dogsTyped.filter((d) => d.medicalStatus === "Healthy").length;
  const needsReviewCount = dogsTyped.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = (dogsTyped.reduce((s, d) => s + d.age, 0) / totalDogs).toFixed(1);

  const stats = [
    { label: "Total Dogs", value: totalDogs, icon: PawPrint, gradient: "from-cyan-500 to-blue-600", glow: "shadow-cyan-500/20" },
    { label: "Healthy", value: healthyCount, icon: Heart, gradient: "from-emerald-400 to-emerald-600", glow: "shadow-emerald-500/20" },
    { label: "Needs Review", value: needsReviewCount, icon: Activity, gradient: "from-amber-400 to-orange-500", glow: "shadow-amber-500/20" },
    { label: "Avg. Age", value: `${avgAge} yrs`, icon: Calendar, gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20" },
  ];

  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Active Roster</h2>
            <p className="mt-1 text-sm text-slate-500">Manage and monitor your rescue animals</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/30 active:translate-y-0">
            <PawPrint className="h-4 w-4" />
            Add Animal
          </button>
        </div>
      </motion.header>

      {/* Stats */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
        }}
        initial="hidden"
        animate="show"
        className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} totalDogs={totalDogs} />
        ))}
      </motion.div>

      {/* Table */}
      <AnimalTable dogs={dogsTyped} />

      {/* UI Kit Showcase — GlowButton variants */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 text-sm font-semibold text-neutral-700">
          UI Kit — GlowButton
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <GlowButton variant="primary">Primary</GlowButton>
          <GlowButton variant="outline">Outline</GlowButton>
          <GlowButton variant="ghost">Ghost</GlowButton>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center text-xs text-slate-400"
      >
        &copy; {new Date().getFullYear()} RescueHub &middot; v2.0
      </motion.p>
    </>
  );
}