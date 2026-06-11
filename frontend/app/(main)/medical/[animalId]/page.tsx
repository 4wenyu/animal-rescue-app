"use client";

import type { ReactNode } from "react";
import {
  MedicalIntakeChecksheet,
  type MedicalFormData,
} from "@/src/components/medical/MedicalIntakeChecksheet";
import { useParams } from "next/navigation";

/**
 * Dynamic medical exam page for a specific animal.
 *
 * Route: /medical/[animalId]
 *
 * The `animalId` is extracted from the URL params. The checksheet
 * collects TPR, weight, microchip status, vaccines, dewormer,
 * topical treatments, and emergency triage signs — all mapping to
 * the Prisma MedicalLog model.
 */
export default function MedicalExamPage(): ReactNode {
  const params = useParams<{ animalId: string }>();
  const animalId = params.animalId;

  // Heuristic species hint — replace with DB lookup in production.
  const speciesHint = animalId.startsWith("CAT-") ? "Cat" : "Dog";

  const handleSave = (data: MedicalFormData): void => {
    // Production: POST to /api/medical/log
    // The payload maps 1:1 to the Prisma MedicalLog model:
    //   weightLbs (Float?), tempPulseResp (Json), microchipScanned (Boolean),
    //   vaccinesAdministered (Json), dewormerAdministered (Json),
    //   emergencySignsNoted (Json)
    console.log("Medical intake payload:", JSON.stringify(data));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <MedicalIntakeChecksheet
        animalId={animalId}
        species={speciesHint}
        onSave={handleSave}
      />
    </div>
  );
}