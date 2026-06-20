/**
 * POST /api/tokens/transaction
 * =============================
 * Atomically process a token transaction (earn, spend, expire, refund).
 *
 * Auth: session required (JWT via NextAuth v5 beta).
 * Body:  TokenTransactionData (validated with Zod).
 *
 * Flow:
 *   1. Authenticate via auth() — extract session.user.id as userId.
 *   2. Parse + validate JSON body against TokenTransactionDataSchema.
 *   3. SPEND guard — reject if wallet.cachedBalance < amount.
 *   4. Delegate to processTokenTransaction() (handles its own $transaction).
 *   5. Return { ok, wallet } with the updated cachedBalance.
 *
 * Idempotency: callers MUST supply a unique idempotencyKey per logical
 * operation. Retries with the same key return the already-committed result
 * (no duplicate ledger row, no duplicate balance change).
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { processTokenTransaction } from "@/lib/services/tokenService";
import { prisma } from "@/lib/prisma";
import { TokenTransactionDataSchema } from "@/lib/schemas/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------- */
/* POST                                                                       */
/* ---------------------------------------------------------------------- */

export async function POST(request: Request) {
  /* ── 1. Authenticate ───────────────────────────────────────────── */
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 }
    );
  }

  const authenticatedUserId = session.user.id as string;

  /* ── 2. Parse + validate body ─────────────────────────────────── */
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json(
        { error: "Bad Request", message: "Body must be a JSON object." },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  let data;
  try {
    // Force userId from session — prevents a caller from specifying a
    // different user's ID in the request body (defence in depth).
    data = TokenTransactionDataSchema.parse({
      ...body,
      userId: authenticatedUserId,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Request body failed schema validation.",
          details: (err as unknown as { issues: { path: readonly (string | number)[]; message: string }[] }).issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Bad Request", message: "Could not parse request body." },
      { status: 400 }
    );
  }

  /* ── 3. SPEND guard ────────────────────────────────────────────── */
  if (data.direction === "SPEND") {
    const wallet = await prisma.tokenWallet.findUnique({
      where: { userId: authenticatedUserId },
      select: { cachedBalance: true, walletId: true },
    });

    if (!wallet) {
      return NextResponse.json(
        {
          error: "Insufficient token balance",
          message: "No wallet found for this user.",
        },
        { status: 400 }
      );
    }

    if (wallet.cachedBalance < data.amount) {
      return NextResponse.json(
        {
          error: "Insufficient token balance",
          message: `Attempted to spend ${data.amount} tokens but only ${wallet.cachedBalance} are available.`,
          code: "TOKEN_INSUFFICIENT_BALANCE",
        },
        { status: 400 }
      );
    }
  }

  /* ── 4. Process transaction ────────────────────────────────────── */
  try {
    const result = await processTokenTransaction(data);

    return NextResponse.json(
      {
        ok: true,
        idempotentReplay: result.idempotentReplay,
        wallet: {
          walletId: result.wallet.walletId,
          cachedBalance: result.wallet.cachedBalance,
          lifetimeEarned: result.wallet.lifetimeEarned,
          lifetimeSpent: result.wallet.lifetimeSpent,
          lifetimeExpired: result.wallet.lifetimeExpired,
          status: result.wallet.status,
        },
        transaction: {
          txnId: result.transaction.txnId,
          direction: result.transaction.direction,
          actionType: result.transaction.actionType,
          amount: result.transaction.amount,
          balanceAfter: result.transaction.balanceAfter,
          idempotencyKey: result.transaction.idempotencyKey,
          createdAt: result.transaction.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    // P2002 = unique constraint violation on idempotencyKey — should not
    // happen since we check before calling, but handle defensively.
    if (
      err instanceof Error &&
      err.message.includes("P2002")
    ) {
      return NextResponse.json(
        {
          error: "Conflict",
          message:
            "A transaction with this idempotencyKey already exists. " +
            "Check the result for the already-committed row.",
        },
        { status: 409 }
      );
    }

    console.error("[api/tokens/transaction] processTokenTransaction failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Transaction processing failed." },
      { status: 500 }
    );
  }
}