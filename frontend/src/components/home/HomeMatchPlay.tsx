"use client";

import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/components/ui/cn";

export function PlayProgress({ step, label }: { step: 1 | 2 | 3; label: string }) {
  return (
    <div className="mt-5" aria-label={label}>
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{label}</p>
      <div className="mt-2 flex gap-2" aria-hidden="true">
        {([1, 2, 3] as const).map((n) => (
          <span
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              n <= step ? "bg-emerald-600" : "bg-emerald-100",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function PlayStep({ prompt, children }: { prompt: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-base font-bold text-slate-900">{prompt}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export function PlayChoice({
  label,
  icon: Icon,
  onPick,
}: {
  label: string;
  icon: LucideIcon;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex items-center gap-3 rounded-2xl border-2 border-emerald-100 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md active:scale-[0.98]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}
