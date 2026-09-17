"use client";

/**
 * /intake — the intake hub page.
 *
 * Four cards routing to /intake/public, /intake/medical, /intake/document-scan
 * and /intake/county (municipal transfer).
 *
 * i18n: shared `useI18n()` hook — SSR renders English, then re-renders with
 * the stored locale and on `rescuehub-locale-change` events from <LocaleSwitch />.
 */
import Link from "next/link";
import { ScanLine, Heart, Shield, ArrowRight, Building2 } from "lucide-react";
import { useI18n } from "@/src/lib/useI18n";

export default function IntakeHubPage() {
  const { tr } = useI18n();

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {tr("intake_hub.title")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {tr("intake_hub.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Public Surrender Portal */}
        <Link
          href="/intake/public"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700">
            {tr("intake_hub.public_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.public_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-500">
            {tr("intake_hub.public_cta")}
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
            {tr("intake_hub.medical_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.medical_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-500">
            {tr("intake_hub.medical_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 3: Staff AI Document Scan */}
        <Link
          href="/intake/document-scan"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:bg-rose-100">
            <ScanLine className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-rose-700">
            {tr("intake_hub.ai_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.ai_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-rose-600 group-hover:text-rose-500">
            {tr("intake_hub.ai_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 4: Municipal / County Transfer (officer handoff) */}
        <Link
          href="/intake/county"
          className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-100">
            <Building2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-amber-700">
            {tr("intake_hub.county_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {tr("intake_hub.county_body")}
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:text-amber-500">
            {tr("intake_hub.county_cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
