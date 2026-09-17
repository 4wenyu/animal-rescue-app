"use client";

/**
 * About dropdown — appears in both the public SiteHeader and the staff Sidebar.
 * Five routes under `/about/*` plus a top-level "About Us" summary entry.
 *
 * i18n: the shared `useI18n()` hook owns locale resolution (localStorage +
 * the `rescuehub-locale-change` event), so this component keeps no dictionary
 * of its own — the dropdown re-renders the moment the locale changes.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

type AboutVariant = "sidebar" | "header";

interface AboutNavProps {
  /** "sidebar" (dark theme) or "header" (light theme). */
  variant?: AboutVariant;
}

const ABOUT_ROUTES = [
  { slug: "mission", labelKey: "nav.about.mission" },
  { slug: "process", labelKey: "nav.about.process" },
  { slug: "story", labelKey: "nav.about.story" },
  { slug: "team", labelKey: "nav.about.team" },
  { slug: "partners", labelKey: "nav.about.partners" },
  { slug: "faq", labelKey: "nav.about.faq" },
  { slug: "about-us", labelKey: "nav.about.about_us" },
  { slug: "privacy", labelKey: "nav.about.privacy" },
  { slug: "terms", labelKey: "nav.about.terms" },
  { slug: "careers", labelKey: "nav.about.careers" },
  { slug: "legal", labelKey: "nav.about.legal" },
  { slug: "contact", labelKey: "nav.about.contact" },
] as const;

export function AboutNav({ variant = "header" }: AboutNavProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { tr } = useI18n();

  // Close on Escape + outside-click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Close the dropdown when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const dropdownLabel = tr("nav.about.label");
  const isActive = pathname?.startsWith("/about");

  // Theme tokens
  const isDark = variant === "sidebar";
  const triggerBase =
    "flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm transition-all duration-200";
  const triggerIdle = isDark
    ? "text-slate-400 hover:bg-white/5 hover:text-white"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  const triggerActive = isDark
    ? "bg-white/10 font-semibold text-white shadow-inner shadow-white/5"
    : "bg-slate-100 font-semibold text-slate-900";
  const menuWrap =
    "absolute left-0 top-full z-50 mt-1 min-w-[220px] overflow-hidden rounded-xl border bg-white shadow-lg shadow-slate-900/10";
  const menuBorder = isDark ? "border-white/10" : "border-slate-200";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${triggerBase} ${isActive || open ? triggerActive : triggerIdle}`}
      >
        <span>{dropdownLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={dropdownLabel}
          className={`${menuWrap} ${menuBorder}`}
        >
          {ABOUT_ROUTES.map(({ slug, labelKey }) => {
            const href = `/about/${slug}`;
            const isCurrent = pathname === href;
            return (
              <Link
                key={slug}
                href={href}
                role="menuitem"
                className={`flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${
                  isCurrent
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-700"
                }`}
              >
                <span>{tr(labelKey)}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 ${isCurrent ? "text-emerald-600" : "text-slate-400"}`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AboutNav;
