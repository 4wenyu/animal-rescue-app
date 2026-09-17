/**
 * Shared intake POST guards used by /api/animals/intake.
 *
 * Kept pure so the daily bonus cap and e-sign hash identity can be unit
 * tested without standing up Postgres.
 */

/** Hard cap on intake bonuses one user may earn per rolling 24h. */
export const MAX_INTAKE_BONUSES_PER_DAY = 25;

/**
 * How many ONBOARDING_BONUS_EARN mints remain in the caller's 24h budget.
 * Never negative — intake itself is never blocked, only the reward stops.
 */
export function remainingIntakeBonusBudget(mintedToday: number): number {
  if (!Number.isFinite(mintedToday) || mintedToday <= 0) {
    return MAX_INTAKE_BONUSES_PER_DAY;
  }
  return Math.max(0, MAX_INTAKE_BONUSES_PER_DAY - mintedToday);
}

/**
 * Treat missing / blank `x-esign-hash` as "no idempotency key" so staff
 * OCR batches (which omit the header) are not collapsed together.
 */
export function normalizeEsignHash(
  header: string | null | undefined,
): string | null {
  if (typeof header !== "string") return null;
  const trimmed = header.trim();
  return trimmed.length === 0 ? null : trimmed;
}
