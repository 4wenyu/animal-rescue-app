"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import {
  PawPrint,
  House,
  LayoutDashboard,
  Heart,
  Activity,
  DollarSign,
  LogOut,
  Sparkles,
  Sun,
  Share2,
  Shield,
  Upload,
} from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";
import { AboutNav } from "./AboutNav";

/**
 * Shared sidebar content (brand, nav links, About dropdown, auth card).
 * Rendered inside the desktop aside and the mobile drawer so both stay
 * visually identical.
 *
 * i18n: the shared `useI18n()` hook owns locale resolution (localStorage +
 * the `rescuehub-locale-change` event), so this file keeps no dictionary of
 * its own. SSR renders English and the hook re-renders with the stored
 * locale after mount — the same behavior the previous isMounted guard gave.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }): ReactNode {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { tr } = useI18n();
  const user = session?.user;
  const userRole = (user as Record<string, unknown>)?.role as string | undefined;
  const staff = userRole === "STAFF" || userRole === "ADMIN";
  const playHref = pathname === "/dashboard" ? "#play" : "/dashboard#play";

  const navItems = [
    { href: "/", label: tr("nav.public_portal"), icon: House },
    { href: "/dashboard", label: tr("nav.dashboard"), icon: LayoutDashboard },
    { href: playHref, label: tr("nav.kennel_walk"), icon: Sparkles },
    { href: "/today", label: tr("nav.today"), icon: Sun },
    ...(staff
      ? [
          { href: "/intake", label: tr("nav.intake"), icon: Heart },
          { href: "/medical", label: tr("nav.medical"), icon: Activity },
          { href: "/shares/review", label: tr("nav.share_review"), icon: Share2 },
          { href: "/staff/roster", label: tr("nav.roster_csv"), icon: Upload },
          { href: "/staff/ops", label: tr("nav.ops"), icon: Shield },
        ]
      : []),
    { href: "/fundraising", label: tr("nav.fundraising"), icon: DollarSign },
  ];

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div>
        {/* Logo / Brand */}
        <div className="p-6 pb-0">
          <Link
            href="/"
            onClick={onNavigate}
            className="mb-8 flex items-center gap-3 px-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
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
        <nav className="space-y-1 px-4" aria-label="Primary">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
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
                    : "bg-emerald-400/20 text-emerald-300"
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
              {tr("nav.sign_out")}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 rotate-90" />
            {tr("nav.staff_login")}
          </Link>
        )}
      </div>
    </>
  );
}
