import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MedicalIntakePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-8 shadow-sm max-w-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Construction className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Staff Medical Intake
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Under Construction — Phase 6
        </p>
        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          The ASPCA TPR checksheet, emergency signs flags, medical history, and
          file linking module will be built here in the next phase.
        </p>
        <Link
          href="/intake"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Intake Options
        </Link>
      </div>
    </div>
  );
}