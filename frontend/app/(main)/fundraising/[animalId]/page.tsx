"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FundraisingWallet } from "@/src/components/fundraising/FundraisingWallet";

/**
 * Dynamic fundraising campaign page for a specific animal.
 *
 * Route: /fundraising/[animalId]
 *
 * Heuristic default goals:
 *   $1,500 for standard intake animals
 *   $5,000 for VET FLAGGED animals (animalId starting with "VET-")
 */
export default function FundraisingPage(): ReactNode {
  const params = useParams<{ animalId: string }>();
  const animalId = params.animalId;

  // Heuristic: VET- prefix = flagged animal with higher target
  const isVetFlagged = animalId.startsWith("VET-");
  const targetGoal = isVetFlagged ? 5000 : 1500;

  const handleDonate = (_data: {
    amount: number;
    allocation: "medical" | "general";
  }): void => {
    // Production: POST to /api/fundraising/donate
    // The payload maps to FundraisingWallet mutations:
    //   animalId: string, amount: number, restrictionType: FundType
    console.log("Donation payload:", JSON.stringify({ animalId, ..._data }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* ── Back button ──────────────────────────────────────── */}
      <div className="mb-4">
        <Link
          href="/fundraising"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Fundraising List
        </Link>
      </div>
      <FundraisingWallet
        animalId={animalId}
        targetGoal={targetGoal}
        currentBalance={0}
      />
    </div>
  );
}