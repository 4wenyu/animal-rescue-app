/**
 * TokenWalletCard — Client Variant
 * =================================
 * Drop-in counterpart to TokenWalletCard.tsx (the Server Component) for
 * parents that are themselves "use client" — e.g., app/dashboard/page.tsx.
 *
 * Fetches /api/tokens/wallet and renders the same balance + recent-activity
 * layout. If `initialData` is supplied (RSC streamed payload), it renders
 * without a request roundtrip.
 *
 * Usage from app/dashboard/page.tsx (a "use client" page):
 *
 *   import { TokenWalletCardClient } from "@/src/components/dashboard/TokenWalletCard.client";
 *
 *   <TokenWalletCardClient />
 */

"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Types                                                                    */
/* ---------------------------------------------------------------------- */

export interface WalletSnapshotDto {
  walletId: string;
  cachedBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  status: string;
  lastActivityAt: string | null;
  displayName: string | null;
}

export interface RecentTxnDto {
  txnId: string;
  direction: "EARN" | "SPEND" | "EXPIRE" | "REFUND";
  actionType: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  notes: string | null;
}

export interface TokenWalletCardClientProps {
  /** Pre-fetched DTOs (optional) — bypasses the API roundtrip on first render. */
  initialData?: {
    wallet: WalletSnapshotDto | null;
    recent: RecentTxnDto[];
  } | null;
  /** Polling interval in ms (default: 0 = no polling). */
  refreshMs?: number;
}

/* ---------------------------------------------------------------------- */
/* Display helpers — duplicated from Server variant, intentionally           */
/* ---------------------------------------------------------------------- */

const DIRECTION_LABEL: Record<RecentTxnDto["direction"], string> = {
  EARN: "Earned",
  SPEND: "Spent",
  EXPIRE: "Expired",
  REFUND: "Refunded",
};

const ACTION_LABEL: Record<string, string> = {
  SHARE_10_GROUPS_EARN: "Shared on 10+ groups",
  VOLUNTEER_HOUR_EARN: "Volunteer hour verified",
  REFERRAL_CONVERTED_EARN: "Referral converted",
  ONBOARDING_BONUS_EARN: "Onboarding bonus",
  SEARCH_FEE_WAIVE_SPEND: "Search fee waived",
  PRIORITY_LISTING_SPEND: "Priority listing boost",
  PRINTED_FLYER_SPEND: "Printed flyer service",
  SHARE_BOOST_SPEND: "Share boost",
  EXPIRE_DEDUCT: "Inactivity expiration",
  ADJUSTMENT_ADMIN: "Admin adjustment",
};

function friendlyAction(actionType: string): string {
  return ACTION_LABEL[actionType] ?? actionType.replace(/_/g, " ").toLowerCase();
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour)
    return `${Math.floor(diffMs / minute)} min${Math.floor(diffMs / minute) === 1 ? "" : "s"} ago`;
  if (diffMs < day)
    return `${Math.floor(diffMs / hour)} hour${Math.floor(diffMs / hour) === 1 ? "" : "s"} ago`;
  if (diffMs < 7 * day)
    return `${Math.floor(diffMs / day)} day${Math.floor(diffMs / day) === 1 ? "" : "s"} ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/* ---------------------------------------------------------------------- */
/* Visual subcomponents                                                     */
/* ---------------------------------------------------------------------- */

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  FROZEN: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

const DIRECTION_BADGE: Record<
  RecentTxnDto["direction"],
  { gradient: string; icon: typeof ArrowUpRight }
> = {
  EARN: { gradient: "from-emerald-500 to-emerald-400", icon: ArrowUpRight },
  SPEND: { gradient: "from-rose-500 to-rose-400", icon: ArrowDownLeft },
  EXPIRE: { gradient: "from-slate-500 to-slate-400", icon: Clock },
  REFUND: { gradient: "from-violet-500 to-violet-400", icon: ArrowUpRight },
};

function BalancePanel({
  balance,
  displayName,
  earned,
  spent,
  status,
}: {
  balance: number;
  displayName: string | null;
  earned: number;
  spent: number;
  status: string;
}) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.ACTIVE;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
      <div className="flex items-start justify-between gap-4 p-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 shadow-lg shadow-amber-500/30">
              <Coins className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Token Balance
              </p>
              {displayName && (
                <p className="text-sm text-slate-500">{displayName}&rsquo;s wallet</p>
              )}
            </div>
          </div>
          <p className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
            {balance.toLocaleString()}
            <span className="ml-2 align-top text-base font-medium text-slate-400">
              tokens
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {status}
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Earned</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Spent</p>
            <p className="text-sm font-semibold text-emerald-600">+{earned.toLocaleString()}</p>
            <p className="text-sm font-semibold text-rose-600">−{spent.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ tx }: { tx: RecentTxnDto }) {
  const isPositive =
    tx.direction === "EARN" || tx.direction === "REFUND" || tx.direction === "EXPIRE";
  const badge = DIRECTION_BADGE[tx.direction];
  const Icon = badge.icon;

  return (
    <li className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${badge.gradient} shadow-sm`}
          aria-hidden
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {friendlyAction(tx.actionType)}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(tx.createdAt)}
            <span className="mx-1 text-slate-300">&middot;</span>
            <span className="font-mono uppercase tracking-wider">
              {DIRECTION_LABEL[tx.direction]}
            </span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-bold tabular-nums ${
            isPositive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isPositive ? "+" : "−"}
          {tx.amount.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400 tabular-nums">
          bal&nbsp;{tx.balanceAfter.toLocaleString()}
        </p>
      </div>
    </li>
  );
}

function EmptyRecent() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <ShieldCheck className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">No activity yet</p>
      <p className="text-xs text-slate-500 max-w-[260px]">
        Share an animal on social media or refer a friend to start earning tokens.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="relative rounded-2xl border border-slate-200/70 bg-white p-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-24 rounded bg-slate-200 animate-pulse" />
              <div className="h-2 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="mt-5 h-12 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <div className="h-3 w-28 rounded bg-slate-200 animate-pulse" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-200 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3 w-40 rounded bg-slate-200 animate-pulse" />
                  <div className="h-2 w-24 rounded bg-slate-200 animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-12 rounded bg-slate-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Main export                                                              */
/* ---------------------------------------------------------------------- */

export function TokenWalletCardClient({
  initialData = null,
  refreshMs = 0,
}: TokenWalletCardClientProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (initialData) return; // skip first fetch if parent streamed data
    let cancelled = false;
    fetch("/api/tokens/wallet", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .catch(() => {
        // Silent — empty/loading shell handles errors visually.
      });
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  useEffect(() => {
    if (!refreshMs || refreshMs < 5000) return;
    const id = setInterval(() => {
      fetch("/api/tokens/wallet", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j && setData(j))
        .catch(() => {});
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  if (!data) return <LoadingSkeleton />;

  if (!data.wallet) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Coins className="h-5 w-5 text-slate-400" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">No wallet yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Your TokenWallet will be created automatically when you earn your first token.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <BalancePanel
          balance={data.wallet.cachedBalance}
          displayName={data.wallet.displayName}
          earned={data.wallet.lifetimeEarned}
          spent={data.wallet.lifetimeSpent}
          status={data.wallet.status}
        />
      </div>
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Recent activity</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Last {data.recent.length}{" "}
              {data.recent.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>
          {data.recent.length === 0 ? (
            <EmptyRecent />
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {data.recent.map((tx) => (
                <RecentRow key={tx.txnId} tx={tx} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}