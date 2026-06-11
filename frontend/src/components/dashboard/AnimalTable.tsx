"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface Dog {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
}

interface AnimalTableProps {
  dogs: Dog[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 },
  },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 130, damping: 16 } },
};

function StatusBadge({ status }: { status: string }) {
  const isHealthy = status === "Healthy";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        isHealthy
          ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/70"
          : "bg-amber-50/80 text-amber-700 border-amber-200/70"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

export function AnimalTable({ dogs }: AnimalTableProps) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Animal Records</h3>
        <button className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/60 border-b border-slate-200">
              <th className="p-4 pl-6 text-xs font-semibold tracking-wider uppercase text-slate-500">Name</th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">Breed</th>
              <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">Age</th>
              <th className="p-4 pr-6 text-xs font-semibold tracking-wider uppercase text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {dogs.map((dog) => (
              <motion.tr
                key={dog.id}
                variants={rowVariant}
                className="group hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200 cursor-pointer"
              >
                <td className="p-4 pl-6">
                  <span className="font-semibold text-slate-900">{dog.name}</span>
                  <span className="ml-2 text-[11px] text-slate-400 font-medium">#{dog.id}</span>
                </td>
                <td className="p-4 text-slate-600">{dog.breed}</td>
                <td className="p-4">
                  <span className="text-slate-600">
                    {dog.age} <span className="text-xs text-slate-400">{dog.age === 1 ? "yr" : "yrs"}</span>
                  </span>
                </td>
                <td className="p-4 pr-6"><StatusBadge status={dog.medicalStatus} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}