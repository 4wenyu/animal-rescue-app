"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, DollarSign, Heart, Search, Sparkles } from "lucide-react";
import { ABOUT_LINKS } from "./nav-items";
import type { TranslateFn } from "./home-strings";

const MENU_LINKS = [
  { href: "/today", labelKey: "nav.today", icon: Sparkles },
  { href: "/lost-pet-intake", labelKey: "nav.find_my_pet", icon: Search },
  { href: "/intake/public", labelKey: "nav.surrender", icon: Heart },
  { href: "/fundraising", labelKey: "nav.fundraising", icon: DollarSign },
] as const;

/** Mobile menu dropdown — entrance animation only (no dead exit block). */
export function MobileMenu({ tr, onClose }: { tr: TranslateFn; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-slate-200/60 bg-white px-6 pb-4 pt-2 md:hidden"
    >
      <div className="space-y-1">
        {ABOUT_LINKS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Icon className="h-4 w-4 text-slate-400" />
            {tr(labelKey)}
          </Link>
        ))}
        <hr className="my-2 border-slate-100" />
        {MENU_LINKS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Icon className="h-4 w-4 text-slate-400" />
            {tr(labelKey)}
          </Link>
        ))}
        <hr className="my-2 border-slate-100" />
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          {tr("nav.sign_in")}
          <ChevronRight className="ml-auto h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
