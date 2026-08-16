"use client";

/**
 * /lost-pet-intake (Suspense-wrapped inner view)
 * ============================================
 * The page-level default export must be wrapped in a Suspense boundary
 * because we read URL search params with `useSearchParams` (Next 16
 * requirement — without it, static prerender bails).
 *
 * This file is the inner view. `page.tsx` is the Suspense wrapper.
 */

import { ArrowLeft } from "lucide-react";
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

  return (
    <>
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Epic 3 · AI Agent Outreach Engine
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        <LostPetAgent
          context={context}
          onExit={() => router.push("/dashboard")}
        />
      </div>
    </>
  );
}
