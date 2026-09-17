"use client";

import Link from "next/link";
import { ChevronRight, DollarSign, Heart, Menu, PawPrint, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { LocaleSwitch } from "@/src/components/LocaleSwitch";
import { AboutDropdown } from "./AboutDropdown";
import { MobileMenu } from "./MobileMenu";
import { useHomeLocale } from "./locale-store";

const DESKTOP_LINKS = [
  { href: "/today", labelKey: "nav.today", icon: Sparkles },
  { href: "/lost-pet-intake", labelKey: "nav.find_my_pet", icon: Search },
  { href: "/intake/public", labelKey: "nav.surrender", icon: Heart },
  { href: "/fundraising", labelKey: "nav.fundraising", icon: DollarSign },
] as const;

export function SiteNav() {
  const { tr } = useHomeLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav aria-label="Main" className="sticky top-[var(--preview-offset,0px)] z-50 border-b border-slate-200/60 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {tr("site.title")}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <AboutDropdown />
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <LocaleSwitch />
          {DESKTOP_LINKS.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4" />
              {tr(labelKey)}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--color-accent-hover) active:scale-[0.98]"
          >
            {tr("nav.sign_in")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Hamburger (mobile) */}
        <div className="flex items-center gap-2 md:hidden">
          <LocaleSwitch />
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div id="mobile-menu">
          <MobileMenu tr={tr} onClose={() => setMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}
