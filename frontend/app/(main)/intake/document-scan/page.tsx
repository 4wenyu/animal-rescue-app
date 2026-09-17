"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BatchUpload } from "@/src/components/intake/BatchUpload";
import { useI18n } from "@/src/lib/useI18n";

/**
 * Staff-only intake workflow: bulk AI document scan.
 *
 * Mounts the drag-and-drop BatchUpload client component, which POSTs each
 * staged file to /api/shelter/intake/map. The route handler validates the
 * extraction against lib/schemas/intake.ts (Zod) and returns a flat array
 * of normalized intake records.
 *
 * The IntakeLegalBanner component hides the ESIGN/UEA notice on this path
 * because that disclaimer applies to citizen-facing consent flows, not
 * staff document processing.
 */
export default function DocumentScanPage() {
  const { locale, tr } = useI18n();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
            {tr("intake_hub.staff_only_badge")}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {tr("intake_hub.ai_doc_title")}
          </h1>
        </div>
        <Link
          href="/intake"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr("nav.back_to_options")}
        </Link>
      </div>

      <BatchUpload locale={locale} />
    </div>
  );
}
