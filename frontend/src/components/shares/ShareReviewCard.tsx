"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { useI18n } from "@/src/lib/useI18n";

import { ShareEvidenceLinks } from "./ShareEvidenceLinks";

export type ShareReviewRow = {
  shareId: string;
  userId: string;
  platform: string;
  status: string;
  contentUrl: string | null;
  platformPostId: string | null;
  createdAt: string;
  evidenceSnapshot: unknown;
  user?: { email?: string | null; displayName?: string | null } | null;
};

type Props = {
  row: ShareReviewRow;
  busy: boolean;
  onReview: (
    shareId: string,
    status: "VERIFIED" | "REJECTED",
    reviewerNote?: string,
  ) => Promise<void>;
};

export function ShareReviewCard({ row, busy, onReview }: Props) {
  const { tr } = useI18n();
  const [note, setNote] = useState("");
  const submitter = row.user?.displayName ?? row.user?.email ?? row.userId;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{submitter}</p>
      <p className="mt-1 text-xs text-slate-500">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
          {row.platform}
        </span>
        {" · "}
        {new Date(row.createdAt).toLocaleString()}
      </p>

      <ShareEvidenceLinks
        shareId={row.shareId}
        contentUrl={row.contentUrl}
        platformPostId={row.platformPostId}
        evidenceSnapshot={row.evidenceSnapshot}
      />

      <label className="mt-4 block">
        <span className="sr-only">{tr("shares.review_note_placeholder")}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={255}
          rows={2}
          placeholder={tr("shares.review_note_placeholder")}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy}
          onClick={() => void onReview(row.shareId, "VERIFIED")}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {tr("shares.review_verify")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void onReview(row.shareId, "REJECTED", note.trim() || undefined)
          }
        >
          <X className="h-4 w-4" />
          {tr("shares.review_reject")}
        </Button>
      </div>
    </article>
  );
}
