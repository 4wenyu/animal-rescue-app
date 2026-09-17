"use client";

import { isPreviewMode } from "@/lib/siteMode";
import { PawPrint } from "lucide-react";

export function RegisterHeading() {
  return (
    <div className="mb-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
        <PawPrint className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Create account
      </h1>
      <p className="mt-1 text-sm text-slate-500">Join the rescue network</p>
      {isPreviewMode() && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          Preview accounts receive one 100-token search credit.
        </p>
      )}
    </div>
  );
}
