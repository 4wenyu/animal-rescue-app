/**
 * ActivityFeedPanel — the dark simulated-alert ticker for /radar/[searchId].
 *
 * Accessibility: the scrolling feed itself is NOT an aria-live region (a
 * new line every ~3s would spam screen readers). Instead a visually-hidden
 * polite live region receives only meaningful search-status changes,
 * passed in via `liveMessage`.
 */

import { useEffect, useRef } from "react";

import { useI18n } from "@/src/lib/useI18n";

import type { FeedEntry } from "./feed";
import type { SearchDto } from "./types";

function FeedLine({ entry }: { entry: FeedEntry }) {
  const Icon = entry.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-700/30 bg-slate-800/60 px-4 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed text-slate-100">{entry.text}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {entry.createdAtLabel}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeedPanel({
  search,
  feed,
  liveMessage,
}: {
  search: SearchDto;
  feed: FeedEntry[];
  liveMessage: string;
}) {
  const { tr } = useI18n();
  const feedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed]);

  return (
    <div className="flex h-[36rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
        <div className="flex items-center gap-2">
          {search.status === "SEARCHING" ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500" />
            </span>
          )}
          <h3 className="text-sm font-bold tracking-wide text-white">
            {tr("radar.activity_feed")}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            ·{" "}
            {search.status === "SEARCHING"
              ? tr("radar.feed_live")
              : tr("radar.feed_closed")}
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
          {tr("radar.events", { count: String(feed.length) })}
        </span>
      </div>
      <div
        ref={feedScrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
      >
        {feed.map((entry) => (
          <FeedLine key={entry.id} entry={entry} />
        ))}
      </div>
      {/* Screen readers hear only real status changes — never the ~3s ticker. */}
      <p aria-live="polite" className="sr-only">
        {liveMessage}
      </p>
    </div>
  );
}
