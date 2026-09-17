"use client";

import Link from "next/link";
import { ArrowLeft, HeartPulse, PawPrint, ShieldCheck, Activity } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

/** Placeholder data — replace with Prisma query in production. */
const RECENT_ANIMALS = [
  { id: "DOG-A001", species: "Dog", intakeDate: "2026-06-08" },
  { id: "CAT-B042", species: "Cat", intakeDate: "2026-06-09" },
  { id: "DOG-C109", species: "Dog", intakeDate: "2026-06-10" },
];

export default function MedicalRecordsPage() {
  const { tr } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Premium Header ──────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr("medical.back_to_dashboard")}
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition">
            <PawPrint className="h-4 w-4" />
            <span>RescueHub</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {/* ── Header ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <HeartPulse className="h-4 w-4 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tr("medical.title")}
            </h1>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {tr("medical.subtitle")}
          </p>
        </div>

        {/* ── Animal Cards ───────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECENT_ANIMALS.map((animal) => (
            <Link
              key={animal.id}
              href={`/medical/${animal.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-rose-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition group-hover:bg-rose-100">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-slate-900 group-hover:text-rose-700 transition">
                    {animal.id}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600">
                    {tr("medical.species_intaken", {
                      species: animal.species,
                      date: animal.intakeDate,
                    })}
                  </span>
                </div>
              </div>
              {/* Action hint */}
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400 transition group-hover:text-rose-600">
                {tr("medical.view_examination")} <ArrowLeft className="h-3 w-3 rotate-180" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Compliance badge ──────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 shadow-sm">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {tr("medical.compliance_esign")}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            {tr("medical.compliance_aspca")}
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span className="inline-flex items-center gap-1">
            {tr("medical.compliance_irs")}
          </span>
        </div>
      </div>
    </div>
  );
}