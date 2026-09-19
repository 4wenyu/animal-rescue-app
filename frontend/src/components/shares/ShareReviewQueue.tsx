"use client";

import { Check, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

type ShareRow = {
  shareId: string;
  userId: string;
  platform: string;
  status: string;
  contentUrl: string | null;
  createdAt: string;
  evidenceSnapshot: { relatedSearchId?: string } | null;
  user?: { email?: string | null; displayName?: string | null } | null;
};

export function ShareReviewQueue({ initialShares }: { initialShares: ShareRow[] }) {
  const { tr } = useI18n();
  const [rows, setRows] = useState(initialShares);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(async (shareId: string, status: "VERIFIED" | "REJECTED") => {
    setError(null);
    setBusy(shareId);
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      setRows((prev) => prev.filter((row) => row.shareId !== shareId));
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("shares.review_error"));
    } finally {
      setBusy(null);
    }
  }, [tr]);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">
        {tr("shares.review_empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {rows.map((row) => (
        <article
          key={row.shareId}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900">
            {row.user?.displayName ?? row.user?.email ?? row.userId}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {row.platform} · {new Date(row.createdAt).toLocaleString()}
          </p>
          {row.contentUrl ? (
            <p className="mt-2 truncate text-xs text-emerald-700">{row.contentUrl}</p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={busy === row.shareId}
              onClick={() => void review(row.shareId, "VERIFIED")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy === row.shareId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {tr("shares.review_verify")}
            </button>
            <button
              type="button"
              disabled={busy === row.shareId}
              onClick={() => void review(row.shareId, "REJECTED")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              {tr("shares.review_reject")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
