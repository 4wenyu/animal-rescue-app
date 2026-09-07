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
 *
 * Returns { ok, animals, tokensAwarded }:
 *   - animals       : array of newly created Animal records (one per intake)
 *   - tokensAwarded : 0 for anonymous citizens; 50/staff-minted per record.
 *   - all atomic: either every animal lands (and every staff bonus mints), or
 *     none.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { PetIntakeBatchSchema, type PetIntake } from "@/lib/schemas/intake";
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

  /* ── 2. Parse + validate body ───────────────────────────────── */
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

  // Onboarding bonus only applies to the authenticated staff path — an
  // anonymous citizen has no wallet to credit (Tier 0.4).
  const shouldMintBonus = submittedUserId !== null;

  /* ── 3. Atomic insert: Animal + IntakeRecord (+ staff bonus) ── */
  try {
    const result = await prisma.$transaction(async (tx) => {
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

      // 3b. Per-animal create + record (+ bonus for staff path only).
      const animals: { animalId: string; intakeId: string }[] = [];
      const bonuses: unknown[] = [];

      for (let i = 0; i < parsed.animals.length; i++) {
        const record = parsed.animals[i];

        const esignHash = request.headers.get("x-esign-hash") ?? null;

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

        // ── Staff-only bonus. Skipped entirely for anonymous citizens. ──
        if (shouldMintBonus && submittedUserId) {
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

      return { animals, bonuses };
    });

    const tokensAwarded = shouldMintBonus
      ? result.animals.length * 50
      : 0;

    return NextResponse.json(
      {
        ok: true,
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
            : `${result.animals.length} animal${result.animals.length === 1 ? "" : "s"} recorded (no token grant for anonymous submissions).`,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/animals/intake] failed:", err);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          err instanceof Error
            ? err.message
            : "Intake transaction failed; nothing was committed.",
      },
      { status: 500 },
    );
  }
}
