import Link from "next/link";
import { PawPrint, ArrowLeft, ShieldCheck } from "lucide-react";
import dogs from "../../../data/dogs.json";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";

// ── Static dog data (same source) ─────────────────
type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
};

export function generateStaticParams() {
  return (dogs as Dog[]).map((d) => ({ id: String(d.id) }));
}

export default async function HoldProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dogsTyped = dogs as Dog[];
  const animal = dogsTyped.find((d) => d.id === Number(id));
  if (!animal) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white px-6">
        <PawPrint className="h-12 w-12 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900">
          Animal Not Found
        </h1>
        <p className="text-sm text-slate-500">
          No animal with ID {id} exists in the roster.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-12">
        {/* ── Back link ──────────────────────────────── */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* ── Header card ──────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`h-2 ${
              animal.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL"
                ? "bg-red-500"
                : animal.euthanasia_risk_status === "AT_RISK"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
          />

          <div className="p-8">
            {/* Animal info */}
            <div className="flex items-start gap-6">
              <div className="relative h-24 w-24">
                <AnimalPhoto
                  src={animal.imageUrl}
                  alt={animal.name}
                  roundedClassName="rounded-2xl"
                  className="border border-slate-200 shadow-sm"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    {animal.name}
                  </h1>
                  {animal.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-red-700">
                      HAYDEN ACT LOCK
                    </span>
                  )}
                  {animal.statutoryHoldCleared ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-emerald-700">
                      <ShieldCheck className="h-3 w-3" />
                      Hold Cleared
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-amber-700">
                      On Hold
                    </span>
                  )}
                </div>
                <p className="mt-1 text-base text-slate-500">{animal.breed}</p>
                <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">
                  <div>
                    <span className="text-xs font-semibold tracking-wide text-slate-400">AGE</span>
                    <p className="mt-0.5 font-medium">{animal.age} years</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-wide text-slate-400">MEDICAL</span>
                    <p
                      className={`mt-0.5 font-medium ${
                        animal.medicalStatus === "Healthy"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {animal.medicalStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hold status details */}
            <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-6">
              <h2 className="text-sm font-semibold text-slate-700">Stray Hold Status</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold tracking-wide text-slate-400">
                    STATUTORY HOLD
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {animal.statutoryHoldCleared ? "Cleared ✅" : "Active — adopt/transfer disabled"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wide text-slate-400">
                    INTAKE DATE
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {new Date(animal.intakeTimestamp).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wide text-slate-400">
                    HOLD EXPIRES
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {new Date(animal.strayHoldExpiresAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wide text-slate-400">
                    COMPLIANCE
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    {animal.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL"
                      ? "Hayden Act — locked"
                      : animal.euthanasia_risk_status === "AT_RISK"
                        ? "Urgent sponsor needed"
                        : "Compliant"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick actions ──────────────────────────────── */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/intake/public"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]">
            Public Surrender Portal
          </Link>
        </div>
      </div>
    </div>
  );
}