"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PawPrint,
  LayoutDashboard,
  Heart,
  Activity,
  DollarSign,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intake/public", label: "Intake", icon: Heart },
  { href: "/medical", label: "Medical", icon: Activity },
  { href: "/fundraising", label: "Fundraising", icon: DollarSign },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-64 shrink-0 flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-300 shadow-2xl shadow-slate-900/30"
    >
      <div>
        {/* Logo / Brand */}
        <div className="p-6 pb-0">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/30">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                RescueHub
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Animal Rescue
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-white/10 font-semibold text-white shadow-inner shadow-white/5"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom status card */}
      <div className="m-4 rounded-xl border border-white/5 bg-gradient-to-br from-slate-800/70 to-slate-800/30 p-4">
        <p className="text-[11px] font-medium text-slate-500">Active Users</p>
        <p className="mt-0.5 text-lg font-bold text-white">12</p>
      </div>
    </motion.aside>
  );
}