"use client";

import type { ReactNode } from "react";
import {
  MedicalIntakeChecksheet,
  type MedicalFormData,
} from "@/src/components/medical/MedicalIntakeChecksheet";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";

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
  const params = useParams();
  const animalId = params.animalId as string;

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Bar with back button ──────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/medical"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Medical Records
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition">
            <PawPrint className="h-4 w-4" />
            <span>RescueHub</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <MedicalIntakeChecksheet
            animalId={animalId}
            species={speciesHint}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}