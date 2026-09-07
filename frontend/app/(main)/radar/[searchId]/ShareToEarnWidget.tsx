"use client";

/**
 * ShareToEarnWidget
 * ==================
 * Sprint C — makes the "share to earn a free search" promise visible and
 * honest on the radar. Two real capabilities:
 *
 *   1. "Create share link" mints a real ViralShareVerification row scoped
 *      to this search (POST /api/shares with relatedSearchId). The user
 *      gets the tracking URL to copy and post.
 *   2. A live progress readout from GET /api/shares?searchId=… showing how
 *      many of THIS search's shares are verified vs the 10-share milestone.
 *
 * No fabricated counts: everything rendered comes from the API. Shares are
 * PENDING until a reviewer/verifier marks them VERIFIED — until then the
 * progress bar honestly shows 0 verified.
 */

import { Check, Copy, Loader2, Link2, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

interface ShareProgress {
  total: number;
  verified: number;
  pending: number;
  milestone: number;
}

interface ShareProgressResponse {
  ok?: boolean;
  total?: number;
  verified?: number;
  pending?: number;
  milestone?: number;
  message?: string;
}

type GrantState =
  | { status: "idle" }
  | { status: "claiming" }
  | { status: "claimed"; balanceAfter?: number }
  | { status: "already"; balanceAfter?: number }
  | { status: "error"; message: string };

export function ShareToEarnWidget({ searchId }: { searchId: string }) {
  const { tr } = useI18n();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<ShareProgress>({
    total: 0,
    verified: 0,
    pending: 0,
    milestone: 10,
  });
  const [grant, setGrant] = useState<GrantState>({ status: "idle" });
  const copyTimerRef = useRef<number | null>(null);

  /* ── Load honest progress for this search ─────────────────────────── */
  useEffect(() => {
    if (!searchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/shares?searchId=${encodeURIComponent(searchId)}`,
          { method: "GET", credentials: "same-origin" },
        );
        const json = (await res.json().catch(() => null)) as
          | ShareProgressResponse
          | null;
        if (cancelled || !json?.ok) return;
        setProgress({
          total: json.total ?? 0,
          verified: json.verified ?? 0,
          pending: json.pending ?? 0,
          milestone: json.milestone ?? 10,
        });
      } catch {
        // Ignore — widget still works; progress just stays at zero.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  /* ── Mint a search-scoped share link ──────────────────────────────── */
  const handleCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      // platformPostId needs ≥12 chars; a random UUID satisfies it and is
      // globally unique (the column is UNIQUE).
      const platformPostId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2).padEnd(12, "x")}`;
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          platform: "GENERIC_LINK",
          platformPostId,
          relatedSearchId: searchId,
          evidenceSnapshot: { source: "radar-share-to-earn" },
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; trackingUrl?: string; message?: string }
        | null;
      if (!res.ok || !json?.ok || !json.trackingUrl) {
        setError(
          json?.message ?? "Couldn't create the share link right now. Please try again.",
        );
        return;
      }
      setTrackingUrl(json.trackingUrl);
      // Refresh progress so the new (pending) share shows up immediately.
      const progressRes = await fetch(
        `/api/shares?searchId=${encodeURIComponent(searchId)}`,
        { method: "GET", credentials: "same-origin" },
      );
      const progressJson = (await progressRes.json().catch(() => null)) as
        | ShareProgressResponse
        | null;
      if (progressJson?.ok) {
        setProgress({
          total: progressJson.total ?? 0,
          verified: progressJson.verified ?? 0,
          pending: progressJson.pending ?? 0,
          milestone: progressJson.milestone ?? 10,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't create the share link right now.",
      );
    } finally {
      setCreating(false);
    }
  }, [creating, searchId]);

  const handleCopy = useCallback(async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
    } catch {
      // Clipboard may be unavailable in some contexts; fall back to
      // selecting the text.
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        const node = document.getElementById("share-track-url");
        if (sel && node) {
          range.selectNodeContents(node);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch {
        /* ignore */
      }
    }
    setCopied(true);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [trackingUrl]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  /* ── Claim the free-search grant (idempotent server-side) ─────────── */
  const handleClaim = useCallback(async () => {
    if (grant.status === "claiming") return;
    setGrant({ status: "claiming" });
    try {
      const res = await fetch("/api/shares/milestone-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ searchId }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            ok?: boolean;
            granted?: boolean;
            alreadyGranted?: boolean;
            balanceAfter?: number;
            message?: string;
          }
        | null;
      if (!res.ok || !json?.ok) {
        setGrant({
          status: "error",
          message: json?.message ?? "Couldn't claim the free search right now.",
        });
        return;
      }
      if (json.alreadyGranted) {
        setGrant({ status: "already", balanceAfter: json.balanceAfter });
      } else if (json.granted) {
        setGrant({ status: "claimed", balanceAfter: json.balanceAfter });
      } else {
        setGrant({
          status: "error",
          message: "The milestone isn't met yet — keep sharing!",
        });
      }
    } catch (err) {
      setGrant({
        status: "error",
        message: err instanceof Error ? err.message : "Couldn't claim the free search.",
      });
    }
  }, [grant.status, searchId]);

  const pct = Math.min(
    100,
    Math.round((progress.verified / progress.milestone) * 100),
  );

  return (
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <Share2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900">
            {tr("radar.share_title")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {tr("radar.share_body")}
          </p>
        </div>
      </div>

      {!trackingUrl ? (
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {creating ? tr("radar.share_creating") : tr("radar.share_cta")}
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {tr("radar.share_link_label")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code
              id="share-track-url"
              className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
              title={trackingUrl}
            >
              {trackingUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? tr("radar.share_copied") : tr("radar.share_copy")}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">{tr("radar.share_post_hint")}</p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {/* ── Honest progress toward the free-search milestone ─────────── */}
      <div className="mt-5 border-t border-emerald-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-700">
            {tr("radar.share_progress", {
              verified: String(progress.verified),
              milestone: String(progress.milestone),
            })}
          </p>
          <p className="text-xs font-medium text-slate-500">
            {tr("radar.share_progress_note")}
          </p>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progress.verified}
          aria-valuemin={0}
          aria-valuemax={progress.milestone}
          aria-label={tr("radar.share_progress", {
            verified: String(progress.verified),
            milestone: String(progress.milestone),
          })}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {progress.verified >= progress.milestone && (
          <div className="mt-3 space-y-2">
            {grant.status === "claimed" && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                {tr("radar.share_granted", {
                  balance: String(grant.balanceAfter ?? ""),
                })}
              </p>
            )}
            {grant.status === "already" && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                {tr("radar.share_already_granted")}
              </p>
            )}
            {grant.status === "claiming" && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white opacity-70"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {tr("radar.share_claiming")}
              </button>
            )}
            {(grant.status === "idle" || grant.status === "error") && (
              <button
                type="button"
                onClick={handleClaim}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98]"
              >
                <Check className="h-3.5 w-3.5" />
                {tr("radar.share_claim")}
              </button>
            )}
            {grant.status === "error" && (
              <p className="text-xs font-medium text-rose-600">{grant.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
