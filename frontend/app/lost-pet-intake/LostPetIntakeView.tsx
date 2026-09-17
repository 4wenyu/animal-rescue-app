"use client";

/**
 * /lost-pet-intake (Suspense-wrapped inner view)
 * ============================================
 * Public intake for pet owners. Reads URL search params (credit/spend/
 * newBalance) which are set when the user arrives from the dashboard
 * sponsor-grant flow; otherwise it is a standalone public page.
 *
 * Back-link is context-aware: a user who arrived from the dashboard
 * sponsor flow goes back to the dashboard; a public visitor goes home.
 */

import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import LostPetAgent from "@/src/components/chat/LostPetAgent";

export default function LostPetIntakeView() {
  const router = useRouter();
  const params = useSearchParams();

  const context = useMemo(() => {
    return {
      creditTxnId: params.get("credit") ?? undefined,
      spendTxnId: params.get("spend") ?? undefined,
      newBalance: (() => {
        const v = params.get("newBalance");
        if (v === null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      })(),
    };
  }, [params]);

  // Came from the dashboard sponsor-grant flow → back to dashboard.
  const cameFromDashboard = Boolean(context.creditTxnId || context.spendTxnId);

  return (
    <>
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <Link
          href={cameFromDashboard ? "/dashboard" : "/"}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          {cameFromDashboard ? "Back to dashboard" : "Back to home"}
        </Link>
        <p className="hidden items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-slate-600 sm:inline-flex">
          <Heart className="h-3 w-3 text-emerald-500" />
          Find My Pet · Secure intake
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        <LostPetAgent
          context={context}
          onExit={() => router.push(cameFromDashboard ? "/dashboard" : "/")}
        />
      </div>
    </>
  );
}