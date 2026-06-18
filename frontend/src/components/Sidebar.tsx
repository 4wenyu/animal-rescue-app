"use client";

import { useSession, signOut } from "next-auth/react";
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
  LogOut,
} from "lucide-react";
import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhCNDict from "../../locales/zh-CN.json";
import zhTWDict from "../../locales/zh-TW.json";
import jaDict from "../../locales/ja.json";
import koDict from "../../locales/ko.json";
import { AboutNav } from "./AboutNav";

/**
 * Bump to 6 locales (Phase 6 i18n expansion).
 * Legacy "zh.json" (Simplified Mandarin) is kept on disk as an exact byte-copy
 * of zh-CN.json so any old lookup path resolves without errors.
 */
const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

// English defaults shown during SSR to prevent hydration mismatch.
const FALLBACK_LABELS: Record<string, string> = {
  "nav.public_portal": "Public Portal",
  "nav.dashboard": "Dashboard",
  "nav.intake": "Intake",
  "nav.medical": "Medical",
  "nav.fundraising": "Fundraising",
  "nav.about.label": "About",
  "nav.about.mission": "Mission",
  "nav.about.legal": "Legal",
  "nav.about.process": "Process",
  "nav.about.story": "Story",
  "nav.about.about_us": "About Us",
  "nav.about.contact": "Contact",
};

function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN"; // legacy alias → Simplified Mandarin
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

function t(key: string): string {
  if (typeof window === "undefined") return FALLBACK_LABELS[key] ?? key;
  try {
    const locale = resolveLocale(localStorage.getItem(STORAGE_KEY));
    const parts = key.split(".");
    let value: unknown = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
    for (const part of parts) {
      if (typeof value !== "object" || value === null) return FALLBACK_LABELS[key] ?? key;
      value = (value as Record<string, unknown>)[part];
    }
    return typeof value === "string" ? value : FALLBACK_LABELS[key] ?? key;
  } catch {
    return FALLBACK_LABELS[key] ?? key;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [, forceUpdate] = useState(0);
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // SSR guard: render fixed English labels until client hydrates.
  const NAV_ITEMS = [
    {
      href: "/",
      label: isMounted ? t("nav.public_portal") : "Public Portal",
      icon: House,
    },
    {
      href: "/dashboard",
      label: isMounted ? t("nav.dashboard") : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/intake",
      label: isMounted ? t("nav.intake") : "Intake",
      icon: Heart,
    },
    {
      href: "/medical",
      label: isMounted ? t("nav.medical") : "Medical",
      icon: Activity,
    },
    {
      href: "/fundraising",
      label: isMounted ? t("nav.fundraising") : "Fundraising",
      icon: DollarSign,
    },
  ] as const;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const user = session?.user;
  const userRole = (user as Record<string, unknown>)?.role as string | undefined;

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

          {/* About dropdown (dark variant) */}
          <AboutNav variant="sidebar" />
        </nav>
      </div>

      {/* User / Auth section */}
      <div className="m-4">
        {user ? (
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-slate-800/70 to-slate-800/30 p-4">
            <p className="truncate text-xs font-medium text-slate-400">
              {user.email}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  userRole === "ADMIN"
                    ? "bg-amber-400/20 text-amber-400"
                    : "bg-cyan-400/20 text-cyan-400"
                }`}
              >
                {userRole}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 rotate-90" />
            Staff Login
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
