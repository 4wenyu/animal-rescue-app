"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  PawPrint,
  House,
  LayoutDashboard,
  Heart,
  Activity,
  DollarSign,
} from "lucide-react";
import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhDict from "../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  zh: zhDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

function t(key: string): string {
  if (typeof window === "undefined") return key;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const locale = stored === "es" || stored === "zh" ? stored : "en";
    const parts = key.split(".");
    let value: unknown = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
    for (const part of parts) {
      if (typeof value !== "object" || value === null) return key;
      value = (value as Record<string, unknown>)[part];
    }
    return typeof value === "string" ? value : key;
  } catch {
    return key;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [, forceUpdate] = useState(0);

  // Re-render when locale changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const NAV_ITEMS = [
    { href: "/", label: t("nav.public_portal"), icon: House },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/intake/public", label: t("nav.intake"), icon: Heart },
    { href: "/medical", label: t("nav.medical"), icon: Activity },
    { href: "/fundraising", label: t("nav.fundraising"), icon: DollarSign },
  ] as const;

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
        {/* Logo / Brand — wrapped in <Link> so clicking routes to / */}
        <div className="p-6 pb-0">
          <Link href="/" className="mb-8 flex items-center gap-3 px-2">
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
          </Link>
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