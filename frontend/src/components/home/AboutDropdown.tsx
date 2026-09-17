"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ABOUT_LINKS } from "./nav-items";
import { useHomeLocale } from "./locale-store";

/**
 * About dropdown — click/keyboard disclosure replacing the old hover-only
 * menu. aria-expanded/aria-haspopup state, Escape-to-close with focus
 * returned to the trigger, focus-within ring, and click-outside overlay.
 * The origin pathname is recorded at open time, so navigating to another
 * route closes the menu without an effect.
 */
export function AboutDropdown() {
  const { tr } = useHomeLocale();
  const pathname = usePathname();
  const [aboutOrigin, setAboutOrigin] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const open = aboutOrigin !== null && aboutOrigin === pathname;
  const close = () => setAboutOrigin(null);

  return (
    <div
      className="relative rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          close();
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setAboutOrigin(open ? null : pathname)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="about-menu"
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        {tr("nav.about.label")}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div
            id="about-menu"
            className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            {ABOUT_LINKS.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {tr(labelKey)}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
