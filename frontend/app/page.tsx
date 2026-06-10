"use client";

import { motion } from "framer-motion";
import {
  PawPrint,
  LayoutDashboard,
  Heart,
  Activity,
  Calendar,
  ChevronRight,
} from "lucide-react";

import dogs from "../data/dogs.json";

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
};

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

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 130, damping: 16 } },
};

function statusBadge(status: string) {
  const isHealthy = status === "Healthy";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
        isHealthy
          ? "bg-emerald-50/80 text-emerald-700 border-emerald-200/70"
          : "bg-amber-50/80 text-amber-700 border-amber-200/70"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {status}
    </span>
  );
}

export default function Dashboard() {
  const dogsTyped = dogs as Dog[];

  const totalDogs = dogsTyped.length;
  const healthyCount = dogsTyped.filter((d) => d.medicalStatus === "Healthy").length;
  const needsReviewCount = dogsTyped.filter((d) => d.medicalStatus === "Needs Review").length;
  const avgAge = (dogsTyped.reduce((s, d) => s + d.age, 0) / totalDogs).toFixed(1);

  const stats = [
    {
      label: "Total Dogs",
      value: totalDogs,
      icon: PawPrint,
      gradient: "from-cyan-500 to-blue-600",
      glow: "shadow-cyan-500/20",
    },
    {
      label: "Healthy",
      value: healthyCount,
      icon: Heart,
      gradient: "from-emerald-400 to-emerald-600",
      glow: "shadow-emerald-500/20",
    },
    {
      label: "Needs Review",
      value: needsReviewCount,
      icon: Activity,
      gradient: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/20",
    },
    {
      label: "Avg. Age",
      value: `${avgAge} yrs`,
      icon: Calendar,
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/20",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 font-sans">
      {/* ─── SIDEBAR ─── */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-64 shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-300 flex flex-col justify-between shadow-2xl shadow-slate-900/30"
      >
        {/* Logo */}
        <div>
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 px-2 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  RescueHub
                </h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                  Animal Rescue
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-4 space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 bg-white/10 text-white rounded-xl font-medium transition-all duration-200 shadow-inner shadow-white/5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 text-sm"
            >
              <Heart className="w-4 h-4" />
              <span>Medical</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 text-sm"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </a>
          </nav>
        </div>

        {/* Bottom */}
        <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-slate-800/70 to-slate-800/30 border border-white/5">
          <p className="text-[11px] text-slate-500 font-medium">Active Users</p>
          <p className="text-lg font-bold text-white mt-0.5">12</p>
        </div>
      </motion.aside>

      {/* ─── MAIN ─── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-10 py-10">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Active Roster
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Manage and monitor your rescue animals
                </p>
              </div>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <PawPrint className="w-4 h-4" />
                Add Animal
              </button>
            </div>
          </motion.header>

          {/* ─── STAT CARDS ─── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={statCardVariant}
                  className="relative group cursor-default"
                >
                  <div
                    className={`relative bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm hover:shadow-lg ${stat.glow} transition-all duration-300 hover:-translate-y-0.5`}
                  >
                    {/* Gradient bar */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${stat.gradient}`}
                    />

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow}`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Mini sparkline / decorator */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {stat.label === "Avg. Age"
                          ? "Across all animals"
                          : `of ${totalDogs} total`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ─── TABLE ─── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Animal Records</h3>
              <button className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100/60 border-b border-slate-200">
                    <th className="p-4 pl-6 text-xs font-semibold tracking-wider uppercase text-slate-500">
                      Name
                    </th>
                    <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                      Breed
                    </th>
                    <th className="p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">
                      Age
                    </th>
                    <th className="p-4 pr-6 text-xs font-semibold tracking-wider uppercase text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {dogsTyped.map((dog) => (
                    <motion.tr
                      key={dog.id}
                      variants={rowVariant}
                      className="group hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-200 cursor-pointer"
                    >
                      <td className="p-4 pl-6">
                        <span className="font-semibold text-slate-900">
                          {dog.name}
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400 font-medium">
                          #{dog.id}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{dog.breed}</td>
                      <td className="p-4">
                        <span className="text-slate-600">
                          {dog.age}{" "}
                          <span className="text-xs text-slate-400">
                            {dog.age === 1 ? "yr" : "yrs"}
                          </span>
                        </span>
                      </td>
                      <td className="p-4 pr-6">{statusBadge(dog.medicalStatus)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>

          {/* ─── FOOTER ─── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-slate-400 text-center mt-8"
          >
            © {new Date().getFullYear()} RescueHub · v2.0
          </motion.p>
        </div>
      </main>
    </div>
  );
}