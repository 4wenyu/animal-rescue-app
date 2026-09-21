"use client";

import { useCallback, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

import { ShareReviewCard, type ShareReviewRow } from "./ShareReviewCard";

export function ShareReviewQueue({
  initialShares,
}: {
  initialShares: ShareReviewRow[];
}) {
  const { tr } = useI18n();
  const [rows, setRows] = useState(initialShares);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(
    async (
      shareId: string,
      status: "VERIFIED" | "REJECTED",
      reviewerNote?: string,
    ) => {
      setError(null);
      setBusy(shareId);
      try {
        const res = await fetch(`/api/shares/${shareId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            status,
            ...(reviewerNote ? { reviewerNote } : {}),
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
        setRows((prev) => prev.filter((row) => row.shareId !== shareId));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : tr("shares.review_error"),
        );
      } finally {
        setBusy(null);
      }
    },
    [tr],
  );

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
        <ShareReviewCard
          key={row.shareId}
          row={row}
          busy={busy === row.shareId}
          onReview={review}
        />
      ))}
    </div>
  );
}
