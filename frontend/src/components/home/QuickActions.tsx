"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, DollarSign, Heart } from "lucide-react";
import { useHomeLocale } from "./locale-store";

const QUICK_LINKS = [
  {
    href: "/intake/public",
    labelKey: "quick_links.surrender_title",
    bodyKey: "quick_links.surrender_body",
    ctaKey: "quick_links.surrender_cta",
    icon: Heart,
    iconTile: "bg-emerald-50",
    iconClass: "text-emerald-500",
    ctaClass: "text-emerald-600",
  },
  {
    href: "/fundraising",
    labelKey: "quick_links.fundraising_title",
    bodyKey: "quick_links.fundraising_body",
    ctaKey: "quick_links.fundraising_cta",
    icon: DollarSign,
    iconTile: "bg-amber-50",
    iconClass: "text-amber-500",
    ctaClass: "text-amber-600",
  },
] as const;

export function QuickActions() {
  const { tr } = useHomeLocale();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {QUICK_LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, x: i === 0 ? -12 : 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href={link.href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${link.iconTile}`}>
                  <Icon className={`h-6 w-6 ${link.iconClass}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {tr(link.labelKey)}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {tr(link.bodyKey)}
                  </p>
                  <span className={`mt-2 inline-flex items-center gap-1 text-sm font-medium transition group-hover:gap-1.5 ${link.ctaClass}`}>
                    {tr(link.ctaKey)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
