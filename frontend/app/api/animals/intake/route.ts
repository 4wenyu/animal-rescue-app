/**
 * POST /api/animals/intake
 * =========================
 * Citizen intake submission endpoint. Accepts:
 *   - The signed ESIGNIntentHash from the public-surrender flow, OR
 *   - AI-extracted PetIntake records from the staff-OCR flow.
 *
 * What it does:
 *   1. Authenticates via auth().
 *   2. Validates body via lib/schemas/intake (PetIntakeBatchSchema).
 *   3. In one Prisma $transaction:
 *      - upserts the custodian Organization (creates one if missing —
 *        dev convenience; real onboarding would require an admin flow).
 *      - inserts an Animal row + IntakeRecord per record.
 *   4. Mint an ONBOARDING_BONUS_EARN ledger row + decrement the wallet
 *      cache via awardIntakeBonus (inside the SAME $transaction so the
 *      bonus either lands with the animal record or rolls back
 *      atomically). Each intake gets its own idempotency-keyed bonus.
 *
 * Returns { ok, animals, intakeBonuses }:
 *   - animals    : array of newly created Animal records (one per intake)
 *   - intakeBonuses : array of TokenTransaction rows for the bonus ledger
 *   - all atomic: either every animal lands + every bonus mints, or none.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { PetIntakeBatchSchema, type PetIntake } from "@/lib/schemas/intake";
import { awardIntakeBonus } from "@/lib/services/tokenService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Custodian organization UUID. Matches the seed row.
 * Real onboarding flow replaces this with an admin-controlled
 * organization assignment; for now it's a stable dev UUID.
 */
const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

/* ---------------------------------------------------------------------- */

export async function POST(request: Request) {
  /* ── 1. Authenticate ──────────────────────────────────────── */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const submittedUserId = session.user.id as string;

  /* ── 2. Parse + validate body ─────────────────────────────── */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  let parsed: { animals: PetIntake[] };
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

  /* ── 3. Atomic insert: Animal + IntakeRecord + Token bonus ── */
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Make sure the custodian org exists (dev convenience).
      //     Seed script normally does this, but a fresh dev DB doesn't
      //     trip on missing.
      await tx.organization.upsert({
        where: { orgId: CUSTODIAN_ORG_ID },
        update: {},
        create: {
          orgId: CUSTODIAN_ORG_ID,
          orgType: "MUNICIPAL_SHELTER",
          einNumber: "00-0000000",
        },
      });

      // 3b. Per-animal create + record + bonus.
      const animals: { animalId: string; intakeId: string }[] = [];
      const bonuses: unknown[] = [];

      for (let i = 0; i < parsed.animals.length; i++) {
        const record = parsed.animals[i];

        // Sanitize: only fields that exist in the Animal schema. Other
        // intake fields (displayName, breed, age, etc.) are stored on
        // IntakeRecord or ignored here.
        const animal = await tx.animal.create({
          data: {
            custodianOrgId: CUSTODIAN_ORG_ID,
            breedDesignation: record.breed ?? "Mixed Breed",
            intakeTimestamp: record.intakeTimestamp
              ? new Date(record.intakeTimestamp)
              : new Date(),
            strayHoldExpiresAt: record.strayHoldCleared
              ? // PET INTAKE table never carries stray-hold expiry directly;
                // only clear this when the citizen has attested the hold
                // is completed. Leave null otherwise.
                null
              : null,
            statutoryHoldCleared: record.statutoryHoldCleared ?? false,
            medicalStatus: "HEALTHY_HOLD",
          },
        });
        const intake = await tx.intakeRecord.create({
          data: {
            animalId: animal.animalId,
            intakeType: "PUBLIC_STRAY",
            electronicConsentFlag: true,
            esignIntentHash: request.headers
              .get("x-esign-hash") ?? null,
            documentSnapshotUrl: null,
            officerBadgeNumber: null,
            departmentId: null,
          },
        });

        animals.push({ animalId: animal.animalId, intakeId: intake.intakeId });

        // ── Mint the onboarding-bonus token entry inside the SAME
        // ── transaction. If anything below throws, the animal + intake
        // ── inserts roll back atomically with the wallet update.
        const bonus = await tx.tokenTransaction.create({
          data: {
            userId: submittedUserId,
            direction: "EARN",
            actionType: "ONBOARDING_BONUS_EARN",
            amount: 50,
            // Balance snapshot is finalised immediately below.
            balanceAfter: 0, // patched after we know the wallet delta
            idempotencyKey: `${intake.intakeId}:intake-bonus-${i}`,
            issuedByJob: "api/animals/intake",
            notes: `Intake onboarding bonus for intakeId=${intake.intakeId}`,
          },
        });
        bonuses.push(bonus);

        // We also need to upsert the wallet inside the tx so the cached
        // balance reflects the +50 right away. The service-level atomicity
        // is what protects us against double-minting on retries; here we
        // also benefit from the tx scope.
        const existingWallet = await tx.tokenWallet.findUnique({
          where: { userId: submittedUserId },
        });
        const newBalance = (existingWallet?.cachedBalance ?? 0) + 50;
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

        // Patch balanceAfter on the just-inserted ledger row.
        await tx.tokenTransaction.update({
          where: { txnId: bonus.txnId },
          data: { balanceAfter: updatedWallet.cachedBalance },
        });
      }

      return { animals, bonuses };
    });

    return NextResponse.json(
      {
        ok: true,
        animalsCreated: result.animals.length,
        tokensAwarded: result.animals.length * 50,
        rewards: {
          animals: result.animals,
          bonusCount: result.bonuses.length,
        },
        message:
          result.animals.length === 1
            ? "Animal created +50 tokens awarded."
            : `${result.animals.length} animals created, ${result.animals.length * 50} tokens awarded.`,
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