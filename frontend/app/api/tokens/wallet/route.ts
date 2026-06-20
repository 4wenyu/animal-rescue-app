/**
 * GET /api/tokens/wallet
 * =======================
 * Read-only endpoint that returns the authenticated user's wallet snapshot
 * + their 5 most recent non-reversal transactions. Consumed by
 * `TokenWalletCard.client.tsx` so the component can be rendered from the
 * existing "/dashboard" client-component page.
 *
 * Auth: session required.
 * Response: 200 { wallet: {...}, recent: [...] } | 401 unauthenticated
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const userId = session.user.id as string;

  const [wallet, recent] = await Promise.all([
    prisma.tokenWallet.findUnique({
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
    }),
    prisma.tokenTransaction.findMany({
      where: { userId, isAdjustment: false },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        txnId: true,
        direction: true,
        actionType: true,
        amount: true,
        balanceAfter: true,
        createdAt: true,
        notes: true,
      },
    }),
  ]);

  return NextResponse.json({
    wallet: wallet
      ? {
          walletId: wallet.walletId,
          cachedBalance: wallet.cachedBalance,
          lifetimeEarned: wallet.lifetimeEarned,
          lifetimeSpent: wallet.lifetimeSpent,
          lifetimeExpired: wallet.lifetimeExpired,
          status: wallet.status,
          lastActivityAt: wallet.lastActivityAt,
          displayName: wallet.user.displayName ?? wallet.user.email,
        }
      : null,
    recent: recent.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}