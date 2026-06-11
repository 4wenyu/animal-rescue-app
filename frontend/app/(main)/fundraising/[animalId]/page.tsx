"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
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
      <FundraisingWallet
        animalId={animalId}
        targetGoal={targetGoal}
        currentBalance={0}
      />
    </div>
  );
}