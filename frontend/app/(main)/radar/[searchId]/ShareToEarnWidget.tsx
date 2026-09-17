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
 *
 * State machines live in ./components (useShareMint, useShareGrant); the
 * mint/copy UI and milestone panel are ShareLinkSection/ShareProgressPanel.
 * This file owns the shared progress fetch and composition.
 */

import { Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

import { ShareLinkSection } from "./components/ShareLinkSection";
import { ShareProgressPanel } from "./components/ShareProgressPanel";
import {
  INITIAL_PROGRESS,
  type ShareProgress,
  type ShareProgressResponse,
} from "./components/shareTypes";
import { useShareGrant } from "./components/useShareGrant";
import { useShareMint } from "./components/useShareMint";

export function ShareToEarnWidget({ searchId }: { searchId: string }) {
  const { tr } = useI18n();

  const mint = useShareMint(searchId, tr);
  const { grant, claim } = useShareGrant(searchId, tr);

  const [progress, setProgress] = useState<ShareProgress>(INITIAL_PROGRESS);

  /* ── Fetch honest progress for this search (single shared helper).
     Pure fetch-and-parse: callers decide how to apply the result. ───── */
  const fetchProgress = useCallback(async (): Promise<ShareProgress | null> => {
    try {
      const res = await fetch(
        `/api/shares?searchId=${encodeURIComponent(searchId)}`,
        { method: "GET", credentials: "same-origin" },
      );
      const json = (await res.json().catch(() => null)) as
        | ShareProgressResponse
        | null;
      if (!json?.ok) return null;
      return {
        total: json.total ?? 0,
        verified: json.verified ?? 0,
        pending: json.pending ?? 0,
        milestone: json.milestone ?? 10,
      };
    } catch {
      // Ignore — widget still works; progress just stays at zero.
      return null;
    }
  }, [searchId]);

  useEffect(() => {
    if (!searchId) return;
    let cancelled = false;
    (async () => {
      const next = await fetchProgress();
      if (!cancelled && next) setProgress(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [searchId, fetchProgress]);

  const { createLink } = mint;
  const handleCreate = useCallback(
    async () => {
      await createLink(async () => {
        // Refresh progress so the new (pending) share shows up immediately.
        const next = await fetchProgress();
        if (next) setProgress(next);
      });
    },
    [createLink, fetchProgress],
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

      <ShareLinkSection
        creating={mint.creating}
        trackingUrl={mint.trackingUrl}
        copied={mint.copied}
        onCreate={handleCreate}
        onCopy={mint.copy}
      />

      {mint.error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {mint.error}
        </p>
      )}

      <ShareProgressPanel progress={progress} grant={grant} onClaim={claim} />
    </div>
  );
}
