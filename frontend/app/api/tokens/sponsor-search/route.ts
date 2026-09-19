import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/api/helpers";
import {
  grantSponsorFundedSearch,
  SEARCH_FEE_AMOUNT,
  SponsorSearchRateLimitError,
} from "@/lib/services/sponsorSearchGrant";
import {
  IdempotencyConflictError,
  InsufficientBalanceError,
} from "@/lib/services/tokenService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  creditKey: z.string().min(8).max(128),
  spendKey: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const gate = await requireRole();
  if (!gate.ok) return gate.response;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "creditKey and spendKey are required." },
      { status: 400 },
    );
  }

  if (body.creditKey === body.spendKey) {
    return NextResponse.json(
      { error: "Bad Request", message: "creditKey and spendKey must differ." },
      { status: 400 },
    );
  }

  try {
    const { credit, spend } = await grantSponsorFundedSearch({
      userId: gate.user.id,
      creditKey: body.creditKey,
      spendKey: body.spendKey,
    });
    return NextResponse.json({
      ok: true,
      fee: SEARCH_FEE_AMOUNT,
      creditTxnId: credit.transaction.txnId,
      spendTxnId: spend.transaction.txnId,
      newBalance: spend.wallet.cachedBalance,
      wallet: spend.wallet,
    });
  } catch (err) {
    if (err instanceof SponsorSearchRateLimitError) {
      return NextResponse.json(
        { error: "Too Many Requests", message: err.message },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfterSeconds) },
        },
      );
    }
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "Insufficient funds", message: err.message },
        { status: 400 },
      );
    }
    if (err instanceof IdempotencyConflictError) {
      return NextResponse.json(
        { error: "Conflict", message: err.message },
        { status: 409 },
      );
    }
    console.error("[api/tokens/sponsor-search]", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not underwrite search." },
      { status: 500 },
    );
  }
}
