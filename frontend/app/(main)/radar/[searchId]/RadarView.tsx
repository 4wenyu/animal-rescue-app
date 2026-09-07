"use client";

/**
 * /radar/[searchId]
 * ==================
 * Epic 3 payoff surface — the user sees the result of activating the
 * Lost Pet Search network.
 *
 * Two visuals:
 *   1. Summary card: the persistent LostPetSearch row's captured fields
 *      (species, breed, colorMarkings, collarId, lastSeen), pulled via
 *      GET /api/searches?searchId=…
 *   2. Activity Feed: a mock ticker that auto-inserts new "outbound
 *      alert" lines every ~3 seconds, simulating the partner network
 *      absorbing the broadcast. Lines are deterministic-but-jittery so
 *      re-mounts don't repeat identical timelines.
 *
 * Re-loads and refreshes won't 404 on a missing searchId (route always
 * exists); instead the GET will return 404 from the API and we surface
 * a graceful error card.
 */

import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Heart,
  Loader2,
  MapPin,
  PawPrint,
  Radio,
  ShieldCheck,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";
import { ShareToEarnWidget } from "./ShareToEarnWidget";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface SearchDto {
  searchId: string;
  userId: string;
  species: string | null;
  breed: string | null;
  colorMarkings: string | null;
  collarId: string | null;
  lastSeen: string | null;
  status: "SEARCHING" | "FOUND" | "CANCELLED";
  debitTxnId: string | null;
  activatedAt: string;
  closedAt: string | null;
  notes: string | null;
}

/* -------------------------------------------------------------------------- */
/* Activity-Feed line generators                                               */
/* -------------------------------------------------------------------------- */

interface FeedEntry {
  id: string;
  text: string;
  createdAtLabel: string;
  icon: typeof ShieldCheck;
}

/**
 * HONEST SIMULATED FEED (Sprint C — review §4.3 High "Radar is obviously
 * mock — and dangerously so").
 *
 * Previously the ticker fabricated real-world claims from a fixed bank
 * ("Three community members reported possible sightings", "Notifying 8–30
 * registered volunteers", "Alerting municipal shelters within a 5-mile
 * radius") with a "· live" label and NO simulation disclaimer. The partner
 * network does not exist yet, so those were fabricated promises to a
 * distressed owner.
 *
 * Now the feed only ever states what is true about the demo:
 *   - the broadcast is QUEUED (not dispatched to real partners),
 *   - the feed is a simulated demo preview,
 *   - concrete next steps the owner can actually take (share, watch).
 * No counts, no cities, no shelter names, no sightings.
 */
const FEED_BANK: {
  icon: typeof ShieldCheck;
  text: (tr: (k: string, vars?: Record<string, string>) => string) => string;
}[] = [
  {
    icon: Radio,
    text: (tr) => tr("radar.feed_queued"),
  },
  {
    icon: ShieldCheck,
    text: (tr) => tr("radar.feed_demo"),
  },
  {
    icon: MapPin,
    text: (tr) => tr("radar.feed_network"),
  },
  {
    icon: PawPrint,
    text: (tr) => tr("radar.feed_validated"),
  },
  {
    icon: Heart,
    text: (tr) => tr("radar.feed_share_hint"),
  },
  {
    icon: Radio,
    text: (tr) => tr("radar.feed_no_sightings"),
  },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _feedCounter = 0;
function nextFeedId() {
  _feedCounter += 1;
  return `feed-${_feedCounter}-${Date.now()}`;
}

function buildInitialFeed(
  tr: (k: string, vars?: Record<string, string>) => string,
): FeedEntry[] {
  const now = new Date();
  return [
    {
      id: nextFeedId(),
      text: tr("radar.feed_initial"),
      createdAtLabel: now.toLocaleTimeString(undefined, { timeStyle: "short" }),
      icon: ShieldCheck,
    },
  ];
}

function buildNextFeed(
  tr: (k: string, vars?: Record<string, string>) => string,
): FeedEntry {
  const bank = pick(FEED_BANK);
  return {
    id: nextFeedId(),
    text: bank.text(tr),
    createdAtLabel: new Date().toLocaleTimeString(undefined, { timeStyle: "short" }),
    icon: bank.icon,
  };
}

/* -------------------------------------------------------------------------- */
/* View                                                                        */
/* -------------------------------------------------------------------------- */

export default function RadarView() {
  const params = useParams<{ searchId: string }>();
  const router = useRouter();
  const { tr } = useI18n();
  const searchId = (params?.searchId ?? "").toString();

  const [search, setSearch] = useState<SearchDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);
  const [feed, setFeed] = useState<FeedEntry[]>(() => buildInitialFeed(tr));
  const feedScrollRef = useRef<HTMLDivElement>(null);
  const streamTimerRef = useRef<number | null>(null);

  /* ── Fetch the search row ──────────────────────────────────────────── */
  useEffect(() => {
    if (!searchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/searches?searchId=${encodeURIComponent(searchId)}`,
          { method: "GET", credentials: "same-origin" },
        );
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; search?: SearchDto; message?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !json?.ok || !json.search) {
          setLoadError(
            json?.message ?? `Could not load search (HTTP ${res.status}).`,
          );
          return;
        }
        setSearch(json.search);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unknown load error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  /* ── Activity Feed ticker — append a new line every 2.6–3.4s. Stop once
     the search reaches a terminal status (FOUND/CANCELLED): a closed
     search must not keep manufacturing "live" alerts. ─────────────── */
  const isSearching = search?.status === "SEARCHING";
  useEffect(() => {
    if (!isSearching) return; // terminal — frozen
    const schedule = () => {
      const delay = 2600 + Math.random() * 800;
      streamTimerRef.current = window.setTimeout(() => {
        setFeed((prev) => [...prev.slice(-12), buildNextFeed(tr)]);
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
    // `tr` restarts the ticker on locale change so new lines are localized.
  }, [isSearching, tr]);

  useEffect(() => {
    feedScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed]);

  const handleCloseSearch = useCallback(() => router.push("/dashboard"), [router]);

  const handleSetStatus = useCallback(
    async (status: "FOUND" | "CANCELLED") => {
      if (!search || patching) return;
      setPatching(true);
      setPatchError(null);
      try {
        const res = await fetch(
          `/api/searches/${encodeURIComponent(search.searchId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ status }),
          },
        );
        const json = (await res.json().catch(() => null)) as
          | { ok: boolean; search?: SearchDto; message?: string }
          | null;
        if (!res.ok || !json?.ok || !json.search) {
          setPatchError(
            json?.message ?? `Could not update search (HTTP ${res.status}).`,
          );
          return;
        }
        setSearch(json.search);
        setFeed((prev) => [
          ...prev,
          {
            id: nextFeedId(),
            text:
              status === "FOUND"
                ? tr("radar.closed_found")
                : tr("radar.closed_cancelled"),
            createdAtLabel: new Date().toLocaleTimeString(undefined, {
              timeStyle: "short",
            }),
            icon: status === "FOUND" ? CheckCircle2 : X,
          },
        ]);
      } catch (err) {
        setPatchError(err instanceof Error ? err.message : "Unknown update error");
      } finally {
        setPatching(false);
      }
    },
    [search, patching, tr],
  );

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr("radar.back_to_dashboard")}
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-base font-semibold text-rose-700">
            {tr("radar.load_error_title")}
          </p>
          <p className="mt-2 text-sm text-rose-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!search) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm font-medium">{tr("radar.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {tr("radar.captured_intake")}
                </h3>
              </div>
              <dl className="space-y-3">
                <SummaryRow
                  icon={PawPrint}
                  label={tr("radar.species")}
                  value={search.species}
                  tr={tr}
                />
                <SummaryRow
                  icon={Tag}
                  label={tr("radar.breed")}
                  value={search.breed}
                  tr={tr}
                />
                <SummaryRow
                  icon={Heart}
                  label={tr("radar.color_markings")}
                  value={search.colorMarkings}
                  tr={tr}
                />
                <SummaryRow
                  icon={ShieldCheck}
                  label={tr("radar.collar_id")}
                  value={search.collarId}
                  tr={tr}
                />
                <SummaryRow
                  icon={MapPin}
                  label={tr("radar.last_seen")}
                  value={search.lastSeen}
                  tr={tr}
                />
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {tr("radar.search_id")}
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
                  {search.searchId}
                </p>
              </div>
            </div>
          </section>

          <section className="lg:col-span-3">
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
                    · {search.status === "SEARCHING" ? tr("radar.feed_live") : tr("radar.feed_closed")}
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {tr("radar.events", { count: String(feed.length) })}
                </span>
              </div>
              <div
                ref={feedScrollRef}
                className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
                aria-live="polite"
              >
                {feed.map((entry) => (
                  <FeedLine key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                               */
/* -------------------------------------------------------------------------- */

function HeroHeader({
  search,
  patching,
  onClose,
  onSetStatus,
}: {
  search: SearchDto;
  patching: boolean;
  onClose: () => void;
  onSetStatus: (status: "FOUND" | "CANCELLED") => void;
}) {
  const { tr } = useI18n();
  const activatedAtFormatted = useMemo(() => {
    const d = new Date(search.activatedAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [search.activatedAt]);

  const terminal = search.status !== "SEARCHING";
  const headline = terminal
    ? search.status === "FOUND"
      ? tr("radar.headline_found")
      : tr("radar.headline_cancelled")
    : tr("radar.headline_active");
  const subline = terminal
    ? search.status === "FOUND"
      ? tr("radar.subline_found")
      : tr("radar.subline_cancelled")
    : tr("radar.subline_active", { date: activatedAtFormatted });

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 p-8 text-white shadow-lg">
      <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-50">
            <Radio className="h-3 w-3" />
            {tr("radar.hero_eyebrow")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{headline}</h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">{subline}</p>
          {!terminal && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold text-emerald-50">
              <Circle className="h-2 w-2" />
              {tr("radar.demo_pill")}
            </p>
          )}
        </div>

        {terminal ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white active:scale-[0.97]"
          >
            <CheckCircle2 className="h-4 w-4" />
            {tr("radar.back_to_dashboard")}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={patching}
              onClick={() => onSetStatus("FOUND")}
              className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {patching ? tr("radar.updating") : tr("radar.mark_as_found")}
            </button>
            <button
              type="button"
              disabled={patching}
              onClick={() => onSetStatus("CANCELLED")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              {tr("radar.cancel_search")}
            </button>
          </div>
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, white 0px, transparent 50%), radial-gradient(circle at 80% 20%, white 0px, transparent 60%)",
        }}
      />
    </div>
  );
}

function SearchStatusStepper({
  status,
}: {
  status: "SEARCHING" | "FOUND" | "CANCELLED";
}) {
  const { tr } = useI18n();
  const steps: {
    key: "SEARCHING" | "FOUND" | "CANCELLED";
    label: string;
    reached: boolean;
  }[] = [
    {
      key: "SEARCHING",
      label: tr("radar.step_activated"),
      reached: true,
    },
    {
      key: "FOUND",
      label: status === "CANCELLED" ? tr("radar.step_not_found") : tr("radar.step_found"),
      reached: status === "FOUND",
    },
    {
      key: "CANCELLED",
      label: tr("radar.step_closed"),
      reached: status === "FOUND" || status === "CANCELLED",
    },
  ];

  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step.reached
                    ? step.key === "CANCELLED" && status === "CANCELLED"
                      ? "bg-slate-400 text-white"
                      : "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold ${
                  step.reached ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 ${
                  steps[i + 1].reached ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  tr,
}: {
  icon: typeof PawPrint;
  label: string;
  value: string | null;
  tr: (k: string, vars?: Record<string, string | number>) => string;
}) {
  const present = typeof value === "string" && value.trim().length > 0;
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          present ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {present ? <Icon className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm ${
            present ? "font-medium text-slate-900" : "italic text-slate-400"
          }`}
        >
          {present ? value : tr("radar.missing")}
        </p>
      </div>
    </div>
  );
}

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
