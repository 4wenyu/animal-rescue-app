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
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const SHELTERS = [
  "Eastvale Municipal Shelter",
  "Cedarbrook Animal Services",
  "Northside Rescue Center",
  "Riverbend Humane Society",
  "Pinecrest Animal Hospital",
];
const VOLUNTEER_CITIES = [
  "Eastvale",
  "Northside",
  "Cedarbrook",
  "Riverbend",
  "Pinecrest",
  "Hillview",
  "Brookside",
];

const FEED_BANK: { icon: typeof ShieldCheck; text: () => string }[] = [
  {
    icon: Radio,
    text: () => `Search broadcast dispatched across the RescueHub partner network.`,
  },
  {
    icon: ShieldCheck,
    text: () => `Alerting municipal shelters within a 5-mile radius…`,
  },
  {
    icon: ShieldCheck,
    text: () => {
      const count = 8 + Math.floor(Math.random() * 22);
      return `Notifying ${count} registered volunteers in ${
        VOLUNTEER_CITIES[Math.floor(Math.random() * VOLUNTEER_CITIES.length)]
      }…`;
    },
  },
  {
    icon: MapPin,
    text: () =>
      `Send-loop engaged for ${
        SHELTERS[Math.floor(Math.random() * SHELTERS.length)]
      } — intake queueing started.`,
  },
  {
    icon: PawPrint,
    text: () =>
      `${pick([
        "Tick-tock patrols",
        "Volunteer foot sweeps",
        "Neighborhood canvassers",
      ])} dispatched in the ${Math.ceil(1 + Math.random() * 12)}-mile radius.`,
  },
  {
    icon: Heart,
    text: () =>
      `${pick([
        "Three community members reported possible sightings.",
        "A local foster has marked themselves available.",
        "Two volunteers have RSVPed to coordinate canvassing.",
      ])}`,
  },
  {
    icon: Radio,
    text: () =>
      `Live presence mirrored to ${pick([
        "Nextdoor Eastvale",
        "Lost-Pets of Eastvale (Facebook)",
        "Cedarbrook Cares (Facebook)",
      ])}.`,
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

function buildInitialFeed(): FeedEntry[] {
  const now = new Date();
  return [
    {
      id: nextFeedId(),
      text: `Search id received. Validating capture against network rules…`,
      createdAtLabel: now.toLocaleTimeString(undefined, { timeStyle: "short" }),
      icon: ShieldCheck,
    },
  ];
}

function buildNextFeed(): FeedEntry {
  const bank = pick(FEED_BANK);
  return {
    id: nextFeedId(),
    text: bank.text(),
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
  const searchId = (params?.searchId ?? "").toString();

  const [search, setSearch] = useState<SearchDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedEntry[]>(() => buildInitialFeed());
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

  /* ── Activity Feed ticker — append a new line every 2.6–3.4s. ──────── */
  useEffect(() => {
    const schedule = () => {
      const delay = 2600 + Math.random() * 800;
      streamTimerRef.current = window.setTimeout(() => {
        setFeed((prev) => [...prev.slice(-12), buildNextFeed()]);
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
  }, []);

  useEffect(() => {
    feedScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [feed]);

  const handleCloseSearch = useCallback(() => router.push("/dashboard"), [router]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-base font-semibold text-rose-700">
            Couldn&rsquo;t load search
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
            <p className="text-sm font-medium">Loading radar…</p>
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
            Back to dashboard
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Epic 3 · Live Rescue Radar
          </p>
        </div>

        <HeroHeader search={search} onClose={handleCloseSearch} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Captured intake</h3>
              </div>
              <dl className="space-y-3">
                <SummaryRow icon={PawPrint} label="Species" value={search.species} />
                <SummaryRow icon={Tag} label="Breed" value={search.breed} />
                <SummaryRow
                  icon={Heart}
                  label="Color & markings"
                  value={search.colorMarkings}
                />
                <SummaryRow
                  icon={ShieldCheck}
                  label="Collar & ID"
                  value={search.collarId}
                />
                <SummaryRow
                  icon={MapPin}
                  label="Last seen"
                  value={search.lastSeen}
                />
              </dl>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  search id
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
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <h3 className="text-sm font-bold tracking-wide text-white">
                    Activity Feed
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    · live
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  {feed.length} events
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
  onClose,
}: {
  search: SearchDto;
  onClose: () => void;
}) {
  const activatedAtFormatted = useMemo(() => {
    const d = new Date(search.activatedAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [search.activatedAt]);

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 p-8 text-white shadow-lg">
      <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-50">
            <Radio className="h-3 w-3" />
            Live Rescue Radar
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Your search network is active
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">
            Activated {activatedAtFormatted}. We&rsquo;re pinging shelters, volunteers,
            and partner networks within range of the last seen location.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white active:scale-[0.97]"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark as complete
        </button>
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

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PawPrint;
  label: string;
  value: string | null;
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
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className={`mt-0.5 text-sm ${
            present ? "font-medium text-slate-900" : "italic text-slate-400"
          }`}
        >
          {present ? value : "(missing)"}
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
