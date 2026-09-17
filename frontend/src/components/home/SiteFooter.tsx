"use client";

import Link from "next/link";
import { PawPrint } from "lucide-react";
import { useHomeLocale } from "./locale-store";

const PUBLIC_LINKS = [
  { href: "/intake/public", labelKey: "footer.surrender_portal" },
  { href: "/fundraising", labelKey: "footer.fundraising_campaigns" },
  { href: "/", labelKey: "footer.adoption_feed" },
] as const;

export function SiteFooter() {
  const { tr } = useHomeLocale();
  const year = String(new Date().getFullYear());

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-emerald-500" />
              <span className="text-base font-bold text-slate-900">
                {tr("site.title")}
              </span>
            </div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
              {tr("footer.tagline")}
            </p>
          </div>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-slate-600">
                {tr("footer.public_section")}
              </p>
              <ul className="space-y-1.5">
                {PUBLIC_LINKS.map(({ href, labelKey }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-slate-600 transition hover:text-slate-900"
                    >
                      {tr(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-slate-600">
                {tr("footer.platform_section")}
              </p>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-slate-600 transition hover:text-slate-900"
                  >
                    {tr("nav.staff_login")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-600">
          {tr("footer.copyright", { year })}
        </div>
      </div>
    </footer>
  );
}
