/**
 * POST /api/tokens/transaction
 * =============================
 * Atomically process a token transaction.
 *
 * Auth: session required (JWT via NextAuth v5 beta).
 * Body:  TokenTransactionData (validated with Zod).
 *
 * Flow:
 *   1. Authenticate via auth() — extract session.user.id + role.
 *   2. Parse + validate JSON body against TokenTransactionDataSchema.
 *   3. Enforce server-side policy:
 *      - Clients may ONLY send SPEND direction.
 *      - actionType must be on the allowed SPEND list.
 *      - amount must be within allowed caps for that actionType.
 *      - EARN/REFUND/EXPIRE are server-only (issued by internal jobs/handlers).
 *   4. SPEND guard — reject if wallet.cachedBalance < amount.
 *   5. Delegate to processTokenTransaction() (handles its own $transaction).
 *   6. Return { ok, wallet } with the updated cachedBalance.
 *
 * Idempotency: callers MUST supply a unique idempotencyKey per logical
 * operation. Retries with the same key return the already-committed result
 * (no duplicate ledger row, no duplicate balance change).
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { processTokenTransaction, InsufficientBalanceError, IdempotencyConflictError } from "@/lib/services/tokenService";
import { prisma } from "@/lib/prisma";
import { TokenTransactionDataSchema } from "@/lib/schemas/token";

/* ---------------------------------------------------------------------- */
/* Server-side token policy (Tier 0.2 hardening)                          */
/* ---------------------------------------------------------------------- */

/** Allowed actionTypes for each direction when called from a client. */
const CLIENT_ALLOWED_ACTIONS: Record<string, readonly string[]> = {
  SPEND: [
    "LOST_PET_SEARCH_SPEND",
    "PRIORITY_LISTING_SPEND",
    "PRINTED_FLYER_SPEND",
    "SHARE_BOOST_SPEND",
    "SEARCH_FEE_WAIVE_SPEND",
  ],
  // EARN / REFUND / EXPIRE are NEVER allowed from client requests.
  // They are issued ONLY by server-internal handlers:
  //   - EARN: intake bonus, share reward, referral, sponsor credit, onboarding
  //   - REFUND: reversal of a spent transaction
  //   - EXPIRE: background expiry cron
} as const;

/** Maximum allowed amounts per actionType for client SPEND requests. */
const SPEND_AMOUNT_CAPS: Record<string, number> = {
  LOST_PET_SEARCH_SPEND: 100,
  PRIORITY_LISTING_SPEND: 50,
  PRINTED_FLYER_SPEND: 20,
  SHARE_BOOST_SPEND: 30,
  SEARCH_FEE_WAIVE_SPEND: 100,
} as const;

/** Maximum total tokens a single client request may SPEND. */
const MAX_CLIENT_SPEND_PER_REQUEST = 100;

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
    //
    // WHITELIST the client surface: provenance/attribution fields
    // (sponsorOrgId, sourceViralShareId, issuedByUserId, issuedByJob,
    // costBasisMinorUnits) are NEVER accepted from a client request — they
    // are server-internal audit fields. Accepting them would let a caller
    // forge 513(i) sponsor attribution or link a spend to an arbitrary
    // share/org.
    const clientAllowed = {
      userId: authenticatedUserId,
      direction: body.direction,
      actionType: body.actionType,
      amount: body.amount,
      idempotencyKey: body.idempotencyKey,
      currency: body.currency,
      notes: body.notes,
    };
    data = TokenTransactionDataSchema.parse(clientAllowed);
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

  /* ── Server-side policy enforcement (Tier 0.2) ───────────────────── */
  // Clients may ONLY send SPEND. EARN/REFUND/EXPIRE are server-only.
  if (data.direction !== "SPEND") {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Client requests may only use direction=SPEND. EARN/REFUND/EXPIRE are server-only.",
      },
      { status: 403 }
    );
  }

  // actionType must be on the allowed SPEND list.
  const allowedActions = CLIENT_ALLOWED_ACTIONS.SPEND;
  if (!allowedActions.includes(data.actionType)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `actionType "${data.actionType}" is not allowed for client SPEND requests.`,
      },
      { status: 403 }
    );
  }

  // Amount cap per actionType.
  const cap = SPEND_AMOUNT_CAPS[data.actionType];
  if (cap !== undefined && data.amount > cap) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Amount ${data.amount} exceeds cap ${cap} for actionType "${data.actionType}".`,
      },
      { status: 403 }
    );
  }

  // Overall per-request cap.
  if (data.amount > MAX_CLIENT_SPEND_PER_REQUEST) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `Amount ${data.amount} exceeds max per-request spend ${MAX_CLIENT_SPEND_PER_REQUEST}.`,
      },
      { status: 403 }
    );
  }

  // RBAC: only STAFF/ADMIN may SPEND for certain actionTypes.
  // (For now, all authenticated users can SPEND on the allowed list.)
  // Future: restrict PRIORITY_LISTING_SPEND to STAFF/ADMIN.
  // const userRole = session.user.role as string;
  // if (data.actionType === "PRIORITY_LISTING_SPEND" && !["STAFF", "ADMIN"].includes(userRole)) {
  //   return NextResponse.json({ error: "Forbidden", message: "Insufficient role." }, { status: 403 });
  // }

  /* ── SPEND guard (pre-check; defense in depth) ───────────────────── */
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
    // happen since processTokenTransaction now translates concurrent
    // duplicates into an idempotent replay, but handle defensively.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Re-fetch the committed row so callers can read the already-committed
      // result instead of guessing from a bare 409.
      const committed = await prisma.tokenTransaction.findUnique({
        where: { idempotencyKey: (data.idempotencyKey as string) ?? "" },
      });
      // Ownership check: idempotencyKey is globally unique, so a caller who
      // guesses another user's key must not read back their ledger row.
      if (committed && committed.userId !== authenticatedUserId) {
        return NextResponse.json(
          {
            error: "Conflict",
            message: "A transaction with this idempotencyKey already exists.",
          },
          { status: 409 }
        );
      }
      if (committed) {
        return NextResponse.json(
          {
            ok: true,
            idempotentReplay: true,
            transaction: {
              txnId: committed.txnId,
              direction: committed.direction,
              actionType: committed.actionType,
              amount: committed.amount,
              balanceAfter: committed.balanceAfter,
              idempotencyKey: committed.idempotencyKey,
              createdAt: committed.createdAt,
            },
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          error: "Conflict",
          message:
            "A transaction with this idempotencyKey already exists.",
        },
        { status: 409 }
      );
    }

    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "Insufficient token balance", message: err.message },
        { status: 400 }
      );
    }

    if (err instanceof IdempotencyConflictError) {
      return NextResponse.json(
        { error: "Conflict", message: err.message },
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