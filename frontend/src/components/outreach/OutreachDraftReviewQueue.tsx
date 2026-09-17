"use client";

/**
 * OutreachDraftReviewQueue — staff/admin human gate for the autonomous
 * outreach agent (Tier 1.7). Lists agent-generated drafts and lets a
 * reviewer APPROVE (→ SENT) or SKIP each one. Nothing is delivered without
 * this step — the queue is the honest human-in-the-loop checkpoint.
 */

import { Check, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";
import { OutreachHoldBar } from "./OutreachHoldBar";

interface DraftRow {
  draftId: string;
  status: string;
  helpAsk: string;
  subject: string;
  body: string;
  sourceNote: string;
  createdAt: string;
  reviewedAt?: string | null;
  profile?: {
    regionLabel?: string | null;
    user?: { displayName?: string } | null;
  } | null;
}

export function OutreachDraftReviewQueue({
  initialDrafts,
}: {
  initialDrafts: DraftRow[];
}) {
  const { tr } = useI18n();
  const [drafts, setDrafts] = useState<DraftRow[]>(initialDrafts);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const review = useCallback(
    async (draftId: string, approve: boolean) => {
      setError(null);
      setBusy(draftId);
      try {
        const res = await fetch(`/api/outreach/drafts/${draftId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ approve }),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; status?: string; message?: string }
          | null;
        if (!res.ok || !json?.ok) {
          setError(json?.message ?? "Couldn't update the draft.");
          return;
        }
        setDrafts((prev) =>
          prev.map((d) =>
            d.draftId === draftId
              ? {
                  ...d,
                  status: json.status ?? d.status,
                  reviewedAt:
                    json.status === "APPROVED"
                      ? new Date().toISOString()
                      : d.reviewedAt,
                }
              : d,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update the draft.");
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const pending = drafts.filter(
    (d) => d.status === "DRAFT" || d.status === "APPROVED",
  );

  const deliver = useCallback(async (draftId: string) => {
    setError(null);
    setBusy(draftId);
    try {
      const res = await fetch(`/api/outreach/drafts/${draftId}/deliver`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; status?: string; message?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setError(json?.message ?? "Couldn't send the draft.");
        return;
      }
      setDrafts((prev) =>
        prev.map((d) =>
          d.draftId === draftId ? { ...d, status: "SENT" } : d,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the draft.");
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{tr("outreach.review_title")}</h2>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          {pending.length} {tr("outreach.review_pending")}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {drafts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {tr("outreach.review_empty")}
        </div>
      ) : (
        drafts.map((d) => (
          <div
            key={d.draftId}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{d.subject}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {d.profile?.user?.displayName ?? "—"}
                  {d.profile?.regionLabel ? ` · ${d.profile.regionLabel}` : ""} ·{" "}
                  {new Date(d.createdAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  d.status === "DRAFT"
                    ? "bg-amber-100 text-amber-800"
                    : d.status === "APPROVED"
                      ? "bg-sky-100 text-sky-800"
                      : d.status === "SENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {d.status === "APPROVED" ? tr("outreach.status_approved") : d.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">{d.body}</p>
            <p className="mt-3 text-[11px] italic text-slate-600">{d.sourceNote}</p>

            {d.status === "APPROVED" && (
              <OutreachHoldBar
                reviewedAt={d.reviewedAt ?? d.createdAt}
                busy={busy === d.draftId}
                onSendNow={() => void deliver(d.draftId)}
                onUndo={() => void review(d.draftId, false)}
                t={tr}
              />
            )}

            {d.status === "DRAFT" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => review(d.draftId, true)}
                  disabled={busy === d.draftId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busy === d.draftId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {tr("outreach.review_approve")}
                </button>
                <button
                  type="button"
                  onClick={() => review(d.draftId, false)}
                  disabled={busy === d.draftId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                  {tr("outreach.review_skip")}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}