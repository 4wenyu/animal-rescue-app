"use client";

import { Check, Copy } from "lucide-react";

export function OutreachOptInSuccess({
  token,
  copied,
  onCopy,
  tr,
}: {
  token: string;
  copied: boolean;
  onCopy: () => void;
  tr: (key: string) => string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-800">{tr("outreach.success")}</p>
      <p className="mt-1 text-xs text-emerald-700">{tr("outreach.token_hint")}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">
          {token}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? tr("outreach.copied") : tr("outreach.copy")}
        </button>
      </div>
    </div>
  );
}
