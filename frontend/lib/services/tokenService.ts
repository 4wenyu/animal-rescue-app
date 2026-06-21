/**
 * RescueHub — Token Service
 * ========================
 * Core ledger operations for Epic 2: Viral Token & Brand Sponsorship
 * Gateway.
 *
 * Architecture:
 *   - Authoritative balance is sum(signed amount) over TokenTransaction rows.
 *     TokenWallet.cachedBalance is a hot-cache; a background reconciliation
 *     job keeps it in sync.
 *   - All mutating operations run inside a single Prisma $transaction for
 *     atomicity: if the wallet update fails, the ledger row is rolled back.
 *   - Idempotency: every call must carry a globally-unique idempotencyKey.
 *     Prisma's UNIQUE constraint on TokenTransaction.idempotencyKey means a
 *     retry raises P2002; we translate that to a successful early-return so
 *     callers can safely retry without side-effects.
 *   - Append-only: TokenTransaction rows are never UPDATEd except via a paired
 *     reversal row (isAdjustment=true, reverseOfTxnId set).
 *
 * Prerequisites:
 *   1. `npx prisma generate` — generates the @prisma/client runtime.
 *   2. The module "@/lib/prisma" must export your Prisma singleton.
 *
 * Production hardening (out of scope here):
 *   - Nightly reconciliation job comparing sum(ledger) vs cachedBalance.
 *   - Per-user rate limiting on SPEND paths.
 *   - SOC2 Type II audit log export for UBIT IRC s 513(i) reporting.
 */

import { Prisma, PrismaClient } from "@prisma/client";
import {
  type TokenTransactionData,
  TokenTransactionDataSchema,
} from "@/lib/schemas/token";

// Re-export the namespace so consumers can still write Prisma.TokenDirection etc.
export { Prisma };

// ---------------------------------------------------------------------------
// Prisma singleton (consumed via @/lib/prisma to survive hot-reload)
// ---------------------------------------------------------------------------

let _prisma: PrismaClient | undefined;

function prisma(): PrismaClient {
  if (!_prisma) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/prisma") as { prisma: PrismaClient };
    _prisma = mod.prisma;
  }
  return _prisma;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ProcessTokenResult {
  transaction: {
    txnId: string;
    userId: string;
    direction: string;
    actionType: string;
    amount: number;
    balanceAfter: number;
    idempotencyKey: string;
    createdAt: Date;
  };
  wallet: {
    walletId: string;
    userId: string;
    cachedBalance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    lifetimeExpired: number;
    status: string;
  };
  /** True when this call was an idempotent replay of an already-committed row. */
  idempotentReplay: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DIRECTION_SIGN: Record<string, -1 | 1> = {
  EARN: 1,
  REFUND: 1,
  EXPIRE: 1,
  SPEND: -1,
} as const;

type LifetimeField = "lifetimeEarned" | "lifetimeSpent" | "lifetimeExpired";

const LIFETIME_COUNTER: Record<string, LifetimeField> = {
  EARN: "lifetimeEarned",
  REFUND: "lifetimeEarned",
  EXPIRE: "lifetimeExpired",
  SPEND: "lifetimeSpent",
} as const;

// ---------------------------------------------------------------------------
// processTokenTransaction
// ---------------------------------------------------------------------------

/**
 * Validate, insert ledger row, and update wallet balance atomically.
 *
 * @param data - TokenTransactionData validated against TokenTransactionDataSchema
 * @returns ProcessTokenResult with ledger row, wallet snapshot, and replay flag
 * @throws ZodError - when data fails schema validation
 * @throws Prisma.PrismaClientKnownRequestError - non-idempotency DB errors
 *
 * @example
 * ```ts
 * const result = await processTokenTransaction({
 *   userId: "550e8400-e29b-41d4-a716-446655440000",
 *   direction: "EARN",
 *   actionType: "ONBOARDING_BONUS_EARN",
 *   amount: 50,
 *   idempotencyKey: `onboarding-${userId}-${Date.now()}`,
 * });
 * if (result.idempotentReplay) {
 *   console.log("Already processed, skipping notification");
 * }
 * ```
 */
export async function processTokenTransaction(
  data: TokenTransactionData
): Promise<ProcessTokenResult> {
  // 1. Validate
  const parsed = TokenTransactionDataSchema.safeParse(data);
  if (!parsed.success) throw parsed.error;
  const d = parsed.data;

  const sign = DIRECTION_SIGN[d.direction]!;
  const delta = sign * d.amount;
  const counterField = LIFETIME_COUNTER[d.direction]!;

  // 2. Atomic transaction
  const result = await prisma().$transaction(async (tx) => {
    // ---- 2a. Idempotency guard ----------------------------------------
    const existing = await tx.tokenTransaction.findUnique({
      where: { idempotencyKey: d.idempotencyKey },
    });
    if (existing) {
      const wallet = await tx.tokenWallet.findUniqueOrThrow({
        where: { userId: d.userId },
      });
      return { transaction: existing, wallet, idempotentReplay: true };
    }

    // ---- 2b. Upsert wallet (create on first transaction) ---------------
    const walletWhere = { userId: d.userId };
    const walletExists = await tx.tokenWallet.findUnique({
      where: walletWhere,
      select: { walletId: true },
    });

    let wallet: Awaited<ReturnType<typeof tx.tokenWallet.findUniqueOrThrow>>;

    if (!walletExists) {
      // First transaction for this user — create wallet.
      // delta must be >= 0 here (EARN/REFUND/EXPIRE); SPEND with no prior
      // balance is rejected at the API layer before this function is called.
      wallet = await tx.tokenWallet.create({
        data: {
          userId: d.userId,
          cachedBalance: Math.max(0, delta),
          lifetimeEarned:
            d.direction === "EARN" || d.direction === "REFUND" ? d.amount : 0,
          lifetimeSpent: d.direction === "SPEND" ? d.amount : 0,
          lifetimeExpired: d.direction === "EXPIRE" ? d.amount : 0,
          status: "ACTIVE",
        },
      });
    } else {
      // Existing wallet — atomic counter increments.
      // Prisma accepts negative increment for SPEND and subtracts correctly.
      wallet = await tx.tokenWallet.update({
        where: walletWhere,
        data: {
          cachedBalance: { increment: delta },
          [counterField]: { increment: d.amount },
          lastActivityAt: new Date(),
        },
      });
    }

    // ---- 2c. Insert immutable ledger row --------------------------------
    const transaction = await tx.tokenTransaction.create({
      data: {
        userId: d.userId,
        direction: d.direction as "EARN" | "SPEND" | "EXPIRE" | "REFUND",
        actionType: d.actionType as import("@prisma/client").TokenAction,
        amount: d.amount,
        balanceAfter: wallet.cachedBalance,
        sourceViralShareId: d.sourceViralShareId,
        costBasisMinorUnits: d.costBasisMinorUnits,
        currency: d.currency,
        sponsorOrgId: d.sponsorOrgId,
        issuedByJob: d.issuedByJob,
        issuedByUserId: d.issuedByUserId,
        notes: d.notes,
        idempotencyKey: d.idempotencyKey,
        isAdjustment: false,
      },
    });

    return { transaction, wallet, idempotentReplay: false };
  });

  return {
    transaction: {
      txnId: result.transaction.txnId,
      userId: result.transaction.userId,
      direction: result.transaction.direction,
      actionType: result.transaction.actionType,
      amount: result.transaction.amount,
      balanceAfter: result.transaction.balanceAfter,
      idempotencyKey: result.transaction.idempotencyKey,
      createdAt: result.transaction.createdAt,
    },
    wallet: {
      walletId: result.wallet.walletId,
      userId: result.wallet.userId,
      cachedBalance: result.wallet.cachedBalance,
      lifetimeEarned: result.wallet.lifetimeEarned,
      lifetimeSpent: result.wallet.lifetimeSpent,
      lifetimeExpired: result.wallet.lifetimeExpired,
      status: result.wallet.status,
    },
    idempotentReplay: result.idempotentReplay,
  };
}

// ---------------------------------------------------------------------------
// awardIntakeBonus — issued by /api/animals/intake on a successful animal
// onboarding. Identity-proof: requires an explicit userId (no fallback).
// ---------------------------------------------------------------------------

/**
 * Award an onboarding bonus when a user successfully onboards an animal.
 * Used by /api/animals/intake. Idempotent via the caller's supplied
 * idempotencyKey — typically "<intakeId>:intake-bonus".
 *
 * @param opts.userId         uuid of the user who submitted intake (from session)
 * @param opts.intakeId       uuid of the new IntakeRecord (FK provenance)
 * @param opts.actionType     defaults to SHARE_10_GROUPS_EARN/ONBOARDING/etc
 *                            (only ONBOARDING_* is currently awarded; others throw)
 * @param opts.amount         bonus in tokens (default 50)
 * @param opts.idempotencyKey caller-generated unique key
 */
export interface AwardIntakeBonusOptions {
  userId: string;
  intakeId: string;
  actionType?: "ONBOARDING_BONUS_EARN";
  amount?: number;
  idempotencyKey: string;
  notes?: string;
}

export async function awardIntakeBonus({
  userId,
  intakeId,
  actionType = "ONBOARDING_BONUS_EARN",
  amount = 50,
  idempotencyKey,
  notes,
}: AwardIntakeBonusOptions) {
  return processTokenTransaction({
    userId,
    direction: "EARN",
    actionType,
    amount,
    idempotencyKey,
    currency: "USD",
    notes: notes ?? `Intake onboarding bonus for intakeId=${intakeId}`,
  });
}

// ---------------------------------------------------------------------------
// awardShareReward — REAL, intended for ViralShareVerification flow.
//
// Behavior (V1, per user direction):
//   - Landing /p/[shareId] ATTEMPTS to mint +5 tokens to the share's user.
//   - The grant is rate-limited by IP per shareId per 24h. The first hit
//     within that window awards; subsequent hits return idempotently
//     without rewarding. (In-memory Map, dev-only — we'll move this to
//     Postgres + `VisitLedger` in production.)
// ---------------------------------------------------------------------------

/** In-memory rate limit for the +5 viral-share reward. */
const _shareRewardTimestamps = new Map<string, number>();
const SHARE_REWARD_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const SHARE_REWARD_AMOUNT = 5;

function rateKey(shareId: string, ip: string) {
  return `${shareId}::${ip}`;
}

export function shareRewardShouldSkip(shareId: string, ip: string): boolean {
  // Returns TRUE if a previous grant already exists for this (shareId, ip).
  const key = rateKey(shareId, ip);
  const ts = _shareRewardTimestamps.get(key);
  if (ts && Date.now() - ts < SHARE_REWARD_WINDOW_MS) {
    return true; // already rewarded within window → skip
  }
  return false;
}

export function recordShareReward(shareId: string, ip: string) {
  _shareRewardTimestamps.set(rateKey(shareId, ip), Date.now());
}

export interface AwardShareRewardOptions {
  userId: string;          // the share's creator (mint target)
  shareId: string;
  amount?: number;         // default 5 per the V1 landing-reward rate
  consumerIp?: string;     // for rate-limit pairing (callers passing ≥)
  idempotencyKey: string;
}

export interface AwardShareRewardResult {
  transaction: unknown | null; // null when skipped due to rate limit
  skipped: boolean;
  skipReason?: "rate_limited";
}

/**
 * Award EARN tokens when a visitor lands on a /p/[shareId] tracking page
 * and hasn't been rewarded in the last 24h for this share.
 *
 * @param opts.userId         the userId of the share's *creator* (the
 *                            referrer gets the reward, not the visitor)
 * @param opts.shareId        the VirusShareVerification.shareId
 * @param opts.amount         token count for a single landing (default 5)
 * @param opts.consumerIp     visitor IP — required for rate-limit pairing
 * @param opts.idempotencyKey caller-generated key, scoped per (shareId, ip)
 */
export async function awardShareReward(
  opts: AwardShareRewardOptions,
): Promise<AwardShareRewardResult> {
  const ip = opts.consumerIp ?? "0.0.0.0";

  if (shareRewardShouldSkip(opts.shareId, ip)) {
    return { transaction: null, skipped: true, skipReason: "rate_limited" };
  }

  const result = await processTokenTransaction({
    userId: opts.userId,
    direction: "EARN",
    actionType: "SHARE_10_GROUPS_EARN",
    amount: opts.amount ?? SHARE_REWARD_AMOUNT,
    idempotencyKey: opts.idempotencyKey,
    currency: "USD",
    sourceViralShareId: opts.shareId,
    notes: `Viral share landing reward for shareId=${opts.shareId}`,
  });

  recordShareReward(opts.shareId, ip);
  return { transaction: result, skipped: false };
}

// ---------------------------------------------------------------------------
// awardReferralConverted / awardVolunteerHour — STUBS, future work.
// ---------------------------------------------------------------------------

export async function awardReferralConverted(
  opts: Omit<AwardShareRewardOptions, "shareId"> & { referralId: string },
): Promise<never> {
  throw new Error(
    "awardReferralConverted not yet implemented. referralId=" + opts.referralId,
  );
}

export async function awardVolunteerHour(
  opts: Omit<AwardShareRewardOptions, "shareId"> & { hourLogId: string },
): Promise<never> {
  throw new Error(
    "awardVolunteerHour not yet implemented. hourLogId=" + opts.hourLogId,
  );
}

// ---------------------------------------------------------------------------
// expireTokens — called by the nightly expiry cron job
// ---------------------------------------------------------------------------

/**
 * Expires tokens for a given wallet after the inactivity period.
 * Called exclusively by a scheduled cron job, not user-facing APIs.
 *
 * @param walletId        - wallet to expire tokens from
 * @param amount          - positive number of tokens to expire
 * @param idempotencyKey  - unique key for this expiry batch
 */
export async function expireTokens(
  walletId: string,
  amount: number,
  idempotencyKey: string
): Promise<ProcessTokenResult> {
  const wallet = await prisma().tokenWallet.findUniqueOrThrow({
    where: { walletId },
  });
  return processTokenTransaction({
    userId: wallet.userId,
    direction: "EXPIRE",
    actionType: "EXPIRE_DEDUCT",
    amount,
    idempotencyKey,
    currency: "USD",
    notes: "Nightly inactivity expiry",
  });
}

// ---------------------------------------------------------------------------
// reverseTransaction — admin correction path
// ---------------------------------------------------------------------------

/**
 * Creates an equal-and-opposite reversal row for an existing ledger entry.
 * The original row is preserved; only the reversal row is inserted.
 * Throws if the target row is itself a reversal.
 *
 * @param txnId          - txnId of the row to reverse
 * @param reason         - audit note describing the correction
 * @param issuedByUserId - admin who approved the reversal
 */
export async function reverseTransaction(
  txnId: string,
  reason: string,
  issuedByUserId: string
): Promise<ProcessTokenResult> {
  return prisma().$transaction(async (tx) => {
    const original = await tx.tokenTransaction.findUniqueOrThrow({
      where: { txnId },
    });

    if (original.isAdjustment) {
      throw new Error(
        `Cannot reverse a reversal row (txnId=${txnId}). ` +
          "Reversals must target original transaction rows."
      );
    }

    // Map each direction to its equal-and-opposite
    const reversalDirection: Record<string, "EARN" | "SPEND" | "EXPIRE" | "REFUND"> = {
      EARN: "SPEND",
      SPEND: "EARN",
      EXPIRE: "REFUND",
      REFUND: "EXPIRE",
    } as const;

    const revDir = reversalDirection[original.direction];
    const isEarnSide = revDir === "EARN" || revDir === "REFUND";
    const revSign = isEarnSide ? 1 : -1;
    const revDelta = revSign * original.amount;

    // Insert reversal row first (balanceAfter is patched after wallet update)
    const reversed = await tx.tokenTransaction.create({
      data: {
        userId: original.userId,
        direction: revDir,
        actionType: "ADJUSTMENT_ADMIN",
        amount: original.amount,
        balanceAfter: original.balanceAfter,
        currency: original.currency ?? "USD",
        idempotencyKey: `reverse-${txnId}`,
        isAdjustment: true,
        reverseOfTxnId: txnId,
        notes: reason,
        issuedByUserId,
      },
    });

    // Update wallet counters
    const wallet = await tx.tokenWallet.update({
      where: { userId: original.userId },
      data: {
        cachedBalance: { increment: revDelta },
        lifetimeEarned: isEarnSide ? { increment: original.amount } : undefined,
        lifetimeSpent: revDir === "SPEND" ? { increment: original.amount } : undefined,
        lifetimeExpired: revDir === "EXPIRE" ? { increment: original.amount } : undefined,
        lastActivityAt: new Date(),
      },
    });

    // Correct balanceAfter now that we have the post-update balance
    await tx.tokenTransaction.update({
      where: { txnId: reversed.txnId },
      data: { balanceAfter: wallet.cachedBalance },
    });

    return {
      transaction: { ...reversed, balanceAfter: wallet.cachedBalance },
      wallet: {
        walletId: wallet.walletId,
        userId: wallet.userId,
        cachedBalance: wallet.cachedBalance,
        lifetimeEarned: wallet.lifetimeEarned,
        lifetimeSpent: wallet.lifetimeSpent,
        lifetimeExpired: wallet.lifetimeExpired,
        status: wallet.status,
      },
      idempotentReplay: false,
    };
  });
}