/**
 * Server-only sponsor-funded search: acknowledgment → +fee EARN → −fee SPEND.
 * Clients never mint. Idempotent via caller-supplied keys.
 */
import { checkRateLimit } from "@/lib/rate-limit";
import {
  processTokenTransaction,
  SEARCH_FEE_AMOUNT,
  type ProcessTokenResult,
} from "@/lib/services/tokenService";

export { SEARCH_FEE_AMOUNT };

export class SponsorSearchRateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Too many sponsor-funded searches. Please wait and try again.");
    this.name = "SponsorSearchRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function grantSponsorFundedSearch(input: {
  userId: string;
  creditKey: string;
  spendKey: string;
}): Promise<{ credit: ProcessTokenResult; spend: ProcessTokenResult }> {
  const { ok, retryAfterSeconds } = checkRateLimit(
    `sponsor-search:${input.userId}`,
    5,
    60 * 60 * 1000,
  );
  if (!ok) throw new SponsorSearchRateLimitError(retryAfterSeconds);

  const credit = await processTokenTransaction({
    userId: input.userId,
    direction: "EARN",
    actionType: "SPONSOR_VIEW_CREDIT_EARN",
    amount: SEARCH_FEE_AMOUNT,
    idempotencyKey: input.creditKey,
    currency: "USD",
    notes:
      "Qualified sponsorship acknowledgment (IRC § 513(i)) — Chewy Lost Pet Search underwrite.",
  });

  const spend = await processTokenTransaction({
    userId: input.userId,
    direction: "SPEND",
    actionType: "LOST_PET_SEARCH_SPEND",
    amount: SEARCH_FEE_AMOUNT,
    idempotencyKey: input.spendKey,
    currency: "USD",
    notes: "Lost Pet Search fee underwritten by sponsor acknowledgment.",
  });

  return { credit, spend };
}
