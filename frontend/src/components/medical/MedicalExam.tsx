"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import type { Dog } from "@/src/components/home/types";
import {
  MedicalIntakeChecksheet,
  type MedicalFormData,
} from "@/src/components/medical/MedicalIntakeChecksheet";
import { useI18n } from "@/src/lib/useI18n";

function finiteOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function MedicalExam({ dog }: { dog: Dog }) {
  const { locale, tr } = useI18n();
  const [error, setError] = useState(false);
  const needsReview = dog.medicalStatus === "Needs Review";
  const statusKey = needsReview ? "medical.Needs_Review" : "medical.Healthy";

  async function handleSave(data: MedicalFormData): Promise<void> {
    setError(false);
    const res = await fetch("/api/medical/log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        rosterId: dog.id,
        weightLbs: finiteOrNull(data.weightLbs),
        tpr: {
          temperatureF: finiteOrNull(data.tpr.temperatureF),
          pulse: finiteOrNull(data.tpr.pulse),
          respiration: finiteOrNull(data.tpr.respiration),
        },
        microchipScanned: data.microchipScanned,
        vaccinesAdministered: data.vaccinesAdministered,
        dewormerAdministered: data.dewormerAdministered,
        emergencySignsNoted: data.emergencySignsNoted,
      }),
    });
    if (!res.ok) {
      setError(true);
      throw new Error("save failed");
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/medical"
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {tr("medical.back_to_list")}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{dog.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {dog.breed} · {tr(statusKey)}
        </p>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {tr("medical.save_failed")}
        </p>
      ) : null}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MedicalIntakeChecksheet
          animalId={String(dog.id)}
          species="Dog"
          locale={locale}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
