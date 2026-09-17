"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  index: number;
  totalDogs: number;
}

const statCardVariant = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 140,
      damping: 16,
      mass: 0.7,
      delay: 0.08 * i,
    },
  }),
};

export function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  glow,
  index,
  totalDogs,
}: StatCardProps) {
  return (
    <motion.div custom={index} variants={statCardVariant} className="relative group cursor-default">
      <div
        className={`relative bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-lg ${glow} transition-all duration-300 hover:-translate-y-0.5`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${gradient}`} />
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {value}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow}`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-slate-600 font-medium">
            {label === "Avg. Age" ? "Across all animals" : `of ${totalDogs} total`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}