/**
 * POST /api/animals/intake
 * =========================
 * Citizen intake submission endpoint. Accepts:
 *   - The signed ESIGNIntentHash from the public-surrender flow, OR
 *   - AI-extracted PetIntake records from the staff-OCR flow.
 *
 * Tier 0.4 / 0.5 hardening:
 *   - Anonymous submissions are allowed (public citizen portal) but mint NO
 *     tokens — there is no identity to credit.
 *   - Authenticated submissions require STAFF/ADMIN role (staff OCR flow).
 *   - Stray-hold semantics are computed SERVER-SIDE from `intakeType`; a
 *     client-supplied `statutoryHoldCleared` boolean is never trusted.
 *   - Batch size is capped to bound work.
 *   - `x-esign-hash` is an idempotency key: a retry of the same waiver
 *     replays the committed IntakeRecord instead of creating a second animal.
 *
 * Returns { ok, animals, tokensAwarded }:
 *   - animals       : array of newly created Animal records (one per intake)
 *   - tokensAwarded : 0 for anonymous citizens; 50/staff-minted per record.
 *   - all atomic: either every animal lands (and every staff bonus mints), or
 *     none.
 */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { PetIntakeBatchSchema, type PetIntake } from "@/lib/schemas/intake";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  normalizeEsignHash,
  remainingIntakeBonusBudget,
} from "@/lib/intakeGuards";
import {
  computeStrayHoldExpiry,
  isStatutoryHoldCleared,
} from "@/src/lib/holdRegulations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Custodian organization UUID. Matches the seed row.
 * Real onboarding flow replaces this with an admin-controlled
 * organization assignment; for now it's a stable dev UUID.
 */
const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

/** Hard cap on animals per batch — bounds the work of a single request. */
const MAX_BATCH_SIZE = 50;

type IntakeAnimalRef = { animalId: string; intakeId: string };

function replayResponse(existing: IntakeAnimalRef): NextResponse {
  return NextResponse.json(
    {
      ok: true,
      replayed: true,
      animalsCreated: 1,
      tokensAwarded: 0,
      rewards: {
        animals: [existing],
        bonusCount: 0,
      },
      message: "Intake already recorded for this e-sign hash.",
    },
    { status: 200 },
  );
}

/* ---------------------------------------------------------------------- */

export async function POST(request: Request) {
  /* ── 1. Optional auth + RBAC ────────────────────────────────── */
  const session = await auth();
  const sessionUser = session?.user as
    | (Record<string, unknown> & { id?: string; role?: string })
    | undefined;
  const submittedUserId = sessionUser?.id ?? null;
  const role = sessionUser?.role;

  // Authenticated callers must be STAFF/ADMIN (the staff OCR flow).
  if (submittedUserId && role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", message: "STAFF/ADMIN role required for staff intake." },
      { status: 403 },
    );
  }

  /* ── 2. Rate limit ──────────────────────────────────────────── */
  // Anonymous submissions are allowed by design (public stray intake), so
  // throttle per caller to bound unbounded Animal row creation. Authenticated
  // staff get their own bucket keyed on user id so a shared office IP can't
  // exhaust the anonymous budget.
  const ip = getClientIp(request);
  const rateLimitKey = submittedUserId
    ? `animals-intake:user:${submittedUserId}`
    : `animals-intake:ip:${ip}`;
  const { ok: withinLimit, retryAfterSeconds } = checkRateLimit(
    rateLimitKey,
    10,
    60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Too many intake submissions — please wait a moment and try again.",
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  /* ── 3. Parse + validate body ───────────────────────────────── */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  let parsed: {
    animals: PetIntake[];
    intakeType: "PUBLIC_STRAY" | "OWNER_SURRENDER";
  };
  try {
    parsed = PetIntakeBatchSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: err.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Bad Request", message: "Could not parse request body." },
      { status: 400 },
    );
  }

  if (!parsed.animals?.length) {
    return NextResponse.json(
      { error: "Validation Error", message: "animals[] must not be empty." },
      { status: 400 },
    );
  }

  if (parsed.animals.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message: `Batch exceeds cap of ${MAX_BATCH_SIZE} animals per request.`,
      },
      { status: 400 },
    );
  }

  // One waiver signature = one animal. A batch plus a hash would collide
  // on the unique esignIntentHash index for every animal after the first.
  const esignHash = normalizeEsignHash(request.headers.get("x-esign-hash"));
  if (esignHash && parsed.animals.length > 1) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message:
          "x-esign-hash is a single-intake idempotency key; send one animal.",
      },
      { status: 400 },
    );
  }

  /* ── 4. Atomic insert: Animal + IntakeRecord (+ staff bonus) ── */
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Replay a retry of the same waiver before creating anything.
      if (esignHash) {
        const existing = await tx.intakeRecord.findFirst({
          where: { esignIntentHash: esignHash },
          select: { intakeId: true, animalId: true },
        });
        if (existing) {
          return {
            animals: [
              { animalId: existing.animalId, intakeId: existing.intakeId },
            ],
            bonuses: [] as unknown[],
            replayed: true,
          };
        }
      }

      // 3a. Make sure the custodian org exists (dev convenience).
      await tx.organization.upsert({
        where: { orgId: CUSTODIAN_ORG_ID },
        update: {},
        create: {
          orgId: CUSTODIAN_ORG_ID,
          orgType: "MUNICIPAL_SHELTER",
          einNumber: "00-0000000",
        },
      });

      // Onboarding bonus only applies to the authenticated staff path — an
      // anonymous citizen has no wallet to credit (Tier 0.4). Count *inside*
      // the transaction after locking the user row so concurrent POSTs cannot
      // each snapshot the same mintedToday and blow past the daily cap.
      let bonusBudget = 0;
      if (submittedUserId !== null) {
        await tx.$queryRaw`
          SELECT 1 FROM users WHERE "userId" = ${submittedUserId} FOR UPDATE
        `;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const mintedToday = await tx.tokenTransaction.count({
          where: {
            userId: submittedUserId,
            actionType: "ONBOARDING_BONUS_EARN",
            createdAt: { gte: since },
          },
        });
        bonusBudget = remainingIntakeBonusBudget(mintedToday);
      }
      const shouldMintBonus = bonusBudget > 0;

      // 3b. Per-animal create + record (+ bonus for staff path only).
      const animals: IntakeAnimalRef[] = [];
      const bonuses: unknown[] = [];

      for (let i = 0; i < parsed.animals.length; i++) {
        const record = parsed.animals[i];

        // Server-side stray-hold semantics (Tier 0.4 + review CRITICAL fix).
        // The client boolean `statutoryHoldCleared` AND any client
        // `intakeTimestamp` are IGNORED — the intake clock is the server clock,
        // so nobody can clear a legal hold by sending a past/garbage date or a
        // body flag.
        const intakeTime = new Date();

        // OWNER_SURRENDER clears the hold only when a verified STAFF/ADMIN
        // recorded it (identity + ownership confirmed in person). Anonymous
        // citizens always get the statutory hold computed from server time,
        // even if they claim owner surrender — an unauthenticated claim cannot
        // clear a legal hold.
        const verifiedOwnerSurrender =
          submittedUserId !== null &&
          (role === "STAFF" || role === "ADMIN") &&
          parsed.intakeType === "OWNER_SURRENDER";

        let holdExpiry: Date | null;
        let holdCleared: boolean;
        if (verifiedOwnerSurrender) {
          // Staff-verified owner surrender — no stray hold applies.
          holdExpiry = null;
          holdCleared = true;
        } else {
          // Everything else holds from server intake time (default 72h).
          holdExpiry = computeStrayHoldExpiry(intakeTime);
          holdCleared = isStatutoryHoldCleared(intakeTime);
        }

        const animal = await tx.animal.create({
          data: {
            custodianOrgId: CUSTODIAN_ORG_ID,
            breedDesignation: record.breed ?? "Mixed Breed",
            intakeTimestamp: intakeTime,
            strayHoldExpiresAt: holdExpiry,
            statutoryHoldCleared: holdCleared,
            medicalStatus: "HEALTHY_HOLD",
          },
        });
        const intake = await tx.intakeRecord.create({
          data: {
            animalId: animal.animalId,
            // Record the SERVER-DECIDED type, not the client-claimed one, so a
            // citizen cannot get an "OWNER_SURRENDER" (hold-free) paper trail
            // past an anonymous endpoint.
            intakeType: verifiedOwnerSurrender ? "OWNER_SURRENDER" : "PUBLIC_STRAY",
            electronicConsentFlag: esignHash !== null,
            esignIntentHash: esignHash,
            documentSnapshotUrl: null,
            officerBadgeNumber: null,
            departmentId: null,
          },
        });

        animals.push({ animalId: animal.animalId, intakeId: intake.intakeId });

        // ── Staff-only bonus. Skipped entirely for anonymous citizens, and
        // stops once the rolling daily budget is exhausted. ──
        if (shouldMintBonus && submittedUserId && bonuses.length < bonusBudget) {
          const bonus = await tx.tokenTransaction.create({
            data: {
              userId: submittedUserId,
              direction: "EARN",
              actionType: "ONBOARDING_BONUS_EARN",
              amount: 50,
              balanceAfter: 0, // patched below after the wallet delta
              idempotencyKey: `${intake.intakeId}:intake-bonus-${i}`,
              issuedByJob: "api/animals/intake",
              notes: `Intake onboarding bonus for intakeId=${intake.intakeId}`,
            },
          });
          bonuses.push(bonus);

          const existingWallet = await tx.tokenWallet.findUnique({
            where: { userId: submittedUserId },
          });
          const updatedWallet = existingWallet
            ? await tx.tokenWallet.update({
                where: { userId: submittedUserId },
                data: {
                  cachedBalance: { increment: 50 },
                  lifetimeEarned: { increment: 50 },
                  lastActivityAt: new Date(),
                },
              })
            : await tx.tokenWallet.create({
                data: {
                  userId: submittedUserId,
                  cachedBalance: 50,
                  lifetimeEarned: 50,
                  lifetimeSpent: 0,
                  lifetimeExpired: 0,
                  status: "ACTIVE",
                },
              });

          await tx.tokenTransaction.update({
            where: { txnId: bonus.txnId },
            data: { balanceAfter: updatedWallet.cachedBalance },
          });
        }
      }

      return { animals, bonuses, replayed: false };
    });

    if (result.replayed && result.animals[0]) {
      return replayResponse(result.animals[0]);
    }

    // Derived from the rows actually committed, not from the animal count —
    // the daily bonus budget can cap the mint partway through a batch.
    const tokensAwarded = result.bonuses.length * 50;

    return NextResponse.json(
      {
        ok: true,
        replayed: false,
        animalsCreated: result.animals.length,
        tokensAwarded,
        rewards: {
          animals: result.animals,
          bonusCount: result.bonuses.length,
        },
        message:
          tokensAwarded > 0
            ? result.animals.length === 1
              ? "Animal created +50 tokens awarded."
              : `${result.animals.length} animals created, ${tokensAwarded} tokens awarded.`
            : submittedUserId
              ? `${result.animals.length} animal${result.animals.length === 1 ? "" : "s"} recorded (daily intake bonus limit reached).`
              : `${result.animals.length} animal${result.animals.length === 1 ? "" : "s"} recorded (no token grant for anonymous submissions).`,
      },
      { status: 201 },
    );
  } catch (err) {
    // Concurrent retries of the same waiver: the unique esignIntentHash
    // index fires P2002. Replay the committed row instead of 500-ing.
    if (
      esignHash &&
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const committed = await prisma.intakeRecord.findFirst({
        where: { esignIntentHash: esignHash },
        select: { intakeId: true, animalId: true },
      });
      if (committed) {
        return replayResponse(committed);
      }
    }
    console.error("[api/animals/intake] failed:", err);
    return NextResponse.json(
      {
        // Never echo internal error text to the client — the insert is
        // transactional, so "nothing was committed" is always accurate.
        error: "Internal Server Error",
        message: "Intake failed; nothing was committed. Please try again.",
      },
      { status: 500 },
    );
  }
}
