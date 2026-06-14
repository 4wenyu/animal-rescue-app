import Link from "next/link";
import { Heart, Shield, ArrowRight } from "lucide-react";

export default function IntakeHubPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Intake Operations
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose an intake path to begin processing an animal record.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Card 1: Public Surrender Portal */}
        <Link
          href="/intake/public"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700">
            Public Surrender Portal
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            ESIGN/UETA-compliant electronic waiver for citizens surrendering
            a pet or reporting a found stray. Creates a legally defensible
            chain of custody.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-500">
            Open Portal
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 2: Staff Medical Intake */}
        <Link
          href="/intake/medical"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700">
            Staff Medical Intake
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            ASPCA TPR (Temp/Pulse/Respiration) checksheet, emergency signs
            flags, medical history, and file linking for shelter staff.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-500">
            Open Medical Intake
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}