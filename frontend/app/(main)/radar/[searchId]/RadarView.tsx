"use client";

/**
 * /radar/[searchId] — Epic 3 payoff surface: the result of activating the
 * Lost Pet Search network. Presentation is split across ./components
 * (hero, stepper, summary card, activity feed, load states); this file
 * owns state and composition: the search row via useRadarSearch, the
 * simulated activity-feed ticker (frozen once terminal), and a
 * visually-hidden aria-live status message that only changes when the
 * search status meaningfully changes.
 *
 * Re-loads won't 404 on a missing searchId (route always exists); instead
 * the GET returns 404 from the API and we surface a graceful error card.
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

import { ActivityFeedPanel } from "./components/ActivityFeedPanel";
import {
  buildClosedFeedEntry,
  buildInitialFeed,
  buildNextFeed,
  type FeedEntry,
} from "./components/feed";
import { HeroHeader } from "./components/HeroHeader";
import { RadarLoadErrorCard, RadarLoadingCard } from "./components/RadarErrorStates";
import { SearchStatusStepper } from "./components/SearchStatusStepper";
import { SearchSummaryCard } from "./components/SearchSummaryCard";
import { useRadarSearch } from "./components/useRadarSearch";
import { ShareToEarnWidget } from "./ShareToEarnWidget";

export default function RadarView() {
  const params = useParams<{ searchId: string }>();
  const router = useRouter();
  const { tr } = useI18n();
  const searchId = (params?.searchId ?? "").toString();

  const { search, loadError, patchError, patching, setStatus } = useRadarSearch(searchId);

  /* Feed ids come from a per-mount ref, read only in effects/handlers. */
  const feedCounterRef = useRef(0);
  const nextFeedId = useCallback(() => {
    feedCounterRef.current += 1;
    return `feed-${feedCounterRef.current}-${Date.now()}`;
  }, []);
  const [feed, setFeed] = useState<FeedEntry[]>(() => buildInitialFeed(tr, "feed-initial"));

  /* ── Activity Feed ticker — append a line every 2.6–3.4s; stop once the
     search is terminal so a closed search stops manufacturing alerts. ── */
  const streamTimerRef = useRef<number | null>(null);
  const isSearching = search?.status === "SEARCHING";
  useEffect(() => {
    if (!isSearching) return; // terminal — frozen
    const schedule = () => {
      streamTimerRef.current = window.setTimeout(() => {
        setFeed((prev) => [
          ...prev.slice(-12),
          buildNextFeed(tr, nextFeedId()),
        ]);
        schedule();
      }, 2600 + Math.random() * 800);
    };
    schedule();
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
    // `tr` restarts the ticker on locale change so new lines are localized.
  }, [isSearching, tr, nextFeedId]);

  const handleCloseSearch = useCallback(() => router.push("/dashboard"), [router]);

  const handleSetStatus = useCallback(
    async (status: "FOUND" | "CANCELLED") => {
      const updated = await setStatus(status);
      if (!updated) return; // patch failed — hook surfaced the error
      setFeed((prev) => [
        ...prev,
        buildClosedFeedEntry(status, tr, nextFeedId()),
      ]);
    },
    [setStatus, tr, nextFeedId],
  );

  if (loadError) return <RadarLoadErrorCard error={loadError} />;
  if (!search) return <RadarLoadingCard />;

  /* Screen-reader status line — changes only when the status changes. */
  const liveMessage =
    search.status === "SEARCHING"
      ? tr("radar.feed_live")
      : search.status === "FOUND"
        ? tr("radar.closed_found")
        : tr("radar.closed_cancelled");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr("radar.back_to_dashboard")}
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
          {tr("radar.eyebrow")}
        </p>
      </div>

      <HeroHeader
        search={search}
        patching={patching}
        onClose={handleCloseSearch}
        onSetStatus={handleSetStatus}
      />

      {patchError && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {patchError}
        </div>
      )}

      <SearchStatusStepper status={search.status} />

      <ShareToEarnWidget searchId={search.searchId} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <SearchSummaryCard search={search} />
        </section>
        <section className="lg:col-span-3">
          <ActivityFeedPanel
            search={search}
            feed={feed}
            liveMessage={liveMessage}
          />
        </section>
      </div>
    </div>
  );
}
