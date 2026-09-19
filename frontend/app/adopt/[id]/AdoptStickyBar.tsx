"use client";

import { Home } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { Dog } from "./adoptTypes";

export function AdoptStickyBar({
  animal,
  available,
  onAdopt,
}: {
  animal: Dog;
  available: boolean;
  onAdopt: () => void;
}) {
  const { tr } = useI18n();
  if (!available) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] sm:hidden">
      <button
        type="button"
        onClick={onAdopt}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
      >
        <Home className="h-4 w-4" />
        {tr("adopt.sticky_adopt", { name: animal.name })}
      </button>
    </div>
  );
}
