/**
 * RescueHub — Token & Viral Share Schemas
 * ========================================
 * Zod schemas that mirror the Prisma enums and input DTOs defined in
 * prisma/schema.prisma (Epic 2: Viral Token & Brand Sponsorship Gateway).
 *
 * NOTE: After running `npx prisma generate`, re-export the enum types from
 * `frontend/generated/prisma` and prefer those in cross-cutting code.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Enums — mirror prisma/schema.prisma                                 */
/* ------------------------------------------------------------------ */

/** TokenDirection: algebraic sign of `amount` in TokenTransaction. */
export const TokenDirectionSchema = z.enum(["EARN", "SPEND", "EXPIRE", "REFUND"]);
export type TokenDirection = z.infer<typeof TokenDirectionSchema>;

/** TokenAction: specific activity that triggered the ledger row. */
export const TokenActionSchema = z.enum([
  "SHARE_10_GROUPS_EARN",
  "VOLUNTEER_HOUR_EARN",
  "REFERRAL_CONVERTED_EARN",
  "ONBOARDING_BONUS_EARN",
  // Phase 3: Corporate-funded sponsor acknowledgment grant.
  // Value flows sponsor -> user. NOT ad-remuneration. UBIT IRC § 513(i)
  // attribution handled via the sponsorOrgId FK on TokenTransaction.
  "SPONSOR_VIEW_CREDIT_EARN",
  "SEARCH_FEE_WAIVE_SPEND",
  "PRIORITY_LISTING_SPEND",
  "PRINTED_FLYER_SPEND",
  "SHARE_BOOST_SPEND",
  // Phase 3: Lost Pet Search service redemption (post-grant SPEND).
  "LOST_PET_SEARCH_SPEND",
  "EXPIRE_DEDUCT",
  "ADJUSTMENT_ADMIN",
]);
export type TokenAction = z.infer<typeof TokenActionSchema>;

/** TokenWalletStatus: lifecycle state of a user's token wallet. */
export const TokenWalletStatusSchema = z.enum(["ACTIVE", "FROZEN", "CLOSED"]);
export type TokenWalletStatus = z.infer<typeof TokenWalletStatusSchema>;

/** SharePlatform: target channel for a viral share verification. */
export const SharePlatformSchema = z.enum([
  "FACEBOOK_GROUP",
  "NEXTDOOR",
  "SUBREDDIT",
  "WHATSAPP_GROUP",
  "INSTAGRAM_STORY",
  "GENERIC_LINK",
]);
export type SharePlatform = z.infer<typeof SharePlatformSchema>;

/** VerificationStatus: outcome of a ViralShareVerification review. */
export const VerificationStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/* ------------------------------------------------------------------ */
/* Input DTO — TokenTransactionData                                    */
/* ------------------------------------------------------------------ */

/**
 * TokenTransactionData — input shape for `processTokenTransaction()`.
 *
 * Invariants:
 *   - amount is always a positive integer; sign is derived from direction.
 *   - idempotencyKey must be globally unique — a P2002 conflict on the
 *     UNIQUE constraint means the logical operation already succeeded;
 *     callers receive the existing row as an idempotent replay.
 *   - sponsorOrgId is optional; when set it attributes corporate funding
 *     to the ledger row for UBIT IRC s 513(i) reporting.
 */
export const TokenTransactionDataSchema = z.object({
  userId: z.string().uuid({ message: "userId must be a valid UUID" }),
  direction: TokenDirectionSchema,
  actionType: TokenActionSchema,
  amount: z
    .number()
    .int({ message: "amount must be an integer" })
    .positive({ message: "amount must be a positive integer" }),
  idempotencyKey: z.string().min(1).max(255),
  sourceViralShareId: z.string().uuid().optional(),
  costBasisMinorUnits: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  sponsorOrgId: z.string().uuid().optional(),
  issuedByJob: z.string().max(255).optional(),
  issuedByUserId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type TokenTransactionData = z.infer<typeof TokenTransactionDataSchema>;

/* ------------------------------------------------------------------ */
/* Share verification                                                  */
/* ------------------------------------------------------------------ */

export const ViralShareVerificationCreateSchema = z.object({
  userId: z.string().uuid(),
  platform: SharePlatformSchema,
  contentUrl: z.string().url().optional(),
  platformPostId: z.string().min(12).max(128),
  evidenceSnapshot: z.record(z.string(), z.unknown()).optional(),
  status: VerificationStatusSchema.default("PENDING"),
  reviewerNote: z.string().max(255).optional(),
});
export type ViralShareVerificationCreate = z.infer<typeof ViralShareVerificationCreateSchema>;