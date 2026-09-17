"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, PawPrint } from "lucide-react";
import { SidebarNav } from "./SidebarNav";

/**
 * App navigation shell.
 *
 * Desktop (md+): fixed dark sidebar, unchanged visuals.
 * Mobile (<md): sticky top bar with a hamburger that opens an off-canvas
 * drawer (role="dialog", Escape/backdrop/route-change close, scroll lock).
 */
export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Route change closes the drawer (backup for the per-link onNavigate).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes; body scroll locks while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Mobile top bar (<md) ──────────────────────────────────── */}
      <div className="sticky top-[var(--preview-offset,0px)] z-30 flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-md shadow-emerald-500/30">
            <PawPrint className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            RescueHub
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Desktop sidebar (md+, unchanged visuals) ──────────────── */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="hidden w-64 shrink-0 flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-300 shadow-2xl shadow-slate-900/30 md:flex"
      >
        <SidebarNav />
      </motion.aside>

      {/* ── Mobile drawer + backdrop (<md) ────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            id="mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-300 shadow-2xl md:hidden"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </>
      )}
    </>
  );
}
