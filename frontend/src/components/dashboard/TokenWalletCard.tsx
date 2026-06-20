/**
 * TokenWalletCard — token balance + recent activity (Server Component).
 * ================================================================
 * Async RSC that:
 *   - Fetches the current user's TokenWallet (with cachedBalance).
 *   - Fetches their 5 most recent TokenTransaction rows.
 *   - Renders a balance pill, lifetime counters, and a styled recent-activity list.
 *
 * Used by:
 *   1. Drop directly into any *server-component parent* (pages, layouts that
 *      don't start with "use client"), passing the resolved `userId` prop.
 *   2. From the existing /dashboard page (which is "use client"), use the
 *      companion TokenWalletClient.tsx wrapper that calls POST /api/tokens/wallet.
 *
 * Why two flavors? Next.js App Router forbids async Server Components inside
 * a client boundary. The server variant is the primary, lowest-latency path;
 * the client wrapper exists so this card can be slotted into /dashboard
 * without refactoring the page.
 */

import { Coins, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

/* ---------------------------------------------------------------------- */
/* Types                                                                    */
/* ---------------------------------------------------------------------- */

export interface TokenWalletCardServerProps {
  /** Authenticated user's primary key — required. */
  userId: string;
  /** Display name shown in the card header. */
  displayName?: string;
  /** Number of recent transactions to display (default 5). */
  recentLimit?: number;
  /** Locale string for number formatting. */
  locale?: string;
  /** Optional i18n dictionary; passes through if you wire it up later. */
  i18n?: Record<string, string>;
}

interface WalletSnapshot {
  walletId: string;
  cachedBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lifetimeExpired: number;
  status: string;
  lastActivityAt: Date | null;
  userName: string | null;
}

interface RecentTxn {
  txnId: string;
  direction: "EARN" | "SPEND" | "EXPIRE" | "REFUND";
  actionType: string;
  amount: number;
  balanceAfter: number;
  createdAt: Date;
  notes: string | null;
}

/* ---------------------------------------------------------------------- */
/* Defaults — direction/action labels and copy                              */
/* ---------------------------------------------------------------------- */

const DIRECTION_LABEL: Record<RecentTxn["direction"], string> = {
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

function formatRelativeTime(d: Date): string {
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
/* Data fetching                                                            */
/* ---------------------------------------------------------------------- */

async function loadWallet(userId: string): Promise<WalletSnapshot | null> {
  return prisma.tokenWallet.findUnique({
    where: { userId },
    select: {
      walletId: true,
      cachedBalance: true,
      lifetimeEarned: true,
      lifetimeSpent: true,
      lifetimeExpired: true,
      status: true,
      lastActivityAt: true,
      user: { select: { displayName: true, email: true } },
    },
  }).then((w) =>
    w
      ? {
          walletId: w.walletId,
          cachedBalance: w.cachedBalance,
          lifetimeEarned: w.lifetimeEarned,
          lifetimeSpent: w.lifetimeSpent,
          lifetimeExpired: w.lifetimeExpired,
          status: w.status,
          lastActivityAt: w.lastActivityAt,
          userName: w.user.displayName ?? w.user.email,
        }
      : null
  );
}

async function loadRecent(userId: string, limit: number): Promise<RecentTxn[]> {
  return prisma.tokenTransaction.findMany({
    where: {
      userId,
      isAdjustment: false, // Exclude internal reversal rows for the user-facing list
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 25),
    select: {
      txnId: true,
      direction: true,
      actionType: true,
      amount: true,
      balanceAfter: true,
      createdAt: true,
      notes: true,
    },
  });
}

/* ---------------------------------------------------------------------- */
/* Components                                                               */
/* ---------------------------------------------------------------------- */

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  FROZEN: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  CLOSED: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

const DIRECTION_BADGE: Record<RecentTxn["direction"], { gradient: string; icon: typeof ArrowUpRight }> = {
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
  displayName?: string;
  earned: number;
  spent: number;
  status: string;
}) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.ACTIVE!;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
      {/* Top accent */}
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
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Earned
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              Spent
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              +{earned.toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-rose-600">
              −{spent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ tx }: { tx: RecentTxn }) {
  const isPositive = tx.direction === "EARN" || tx.direction === "REFUND" || tx.direction === "EXPIRE";
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

/* ---------------------------------------------------------------------- */
/* Main export                                                              */
/* ---------------------------------------------------------------------- */

export default async function TokenWalletCard({
  userId,
  displayName,
  recentLimit = 5,
}: TokenWalletCardServerProps) {
  // Run independent reads in parallel — no need for a single transaction
  // since the page is read-only with respect to the wallet state.
  const [wallet, recent] = await Promise.all([
    loadWallet(userId),
    loadRecent(userId, recentLimit),
  ]);

  // First-run UX: wallet row absent until first transaction.
  if (!wallet) {
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
          balance={wallet.cachedBalance}
          displayName={displayName ?? wallet.userName ?? undefined}
          earned={wallet.lifetimeEarned}
          spent={wallet.lifetimeSpent}
          status={wallet.status}
        />
      </div>
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">
                Recent activity
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Last {recent.length} {recent.length === 1 ? "transaction" : "transactions"}
            </p>
          </div>
          {recent.length === 0 ? (
            <EmptyRecent />
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {recent.map((tx) => (
                <RecentRow key={tx.txnId} tx={tx} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}