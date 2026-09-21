import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { campaignGoal } from "@/lib/fundraisingDonate";
import { rosterAnimalId } from "@/lib/medicalLog";
import { findCatalogDog } from "@/lib/roster";
import { ensureFundraisingAnimal } from "@/lib/services/fundraisingAnimal";

export type FundraisingPledgeInput = {
  rosterId: number;
  amount: number;
  allocation: "medical" | "general";
};

export async function applyFundraisingPledge(input: FundraisingPledgeInput) {
  const dog = findCatalogDog(input.rosterId);
  if (!dog) return null;
  const animalId = rosterAnimalId(dog.id);
  const restrictionType =
    input.allocation === "medical" ? "MEDICAL" : "GENERAL_CARE";
  const medicalStatus =
    dog.medicalStatus === "Needs Review" ? "ISOLATION" : "HEALTHY_HOLD";
  const targetAmount = campaignGoal(dog.medicalStatus === "Needs Review");

  const wallet = await prisma.$transaction(async (tx) => {
    await ensureFundraisingAnimal(tx, { animalId, dog, medicalStatus });
    return tx.fundraisingWallet.upsert({
      where: { animalId },
      create: {
        animalId,
        targetAmount,
        currentBalance: input.amount,
        restrictionType,
      },
      update: { currentBalance: { increment: input.amount } },
    });
  });

  return { wallet, animalId, dog };
}

export type StripeFulfillResult =
  | { ok: true; alreadyApplied: boolean; rosterId: number; animalId: string }
  | { ok: false; reason: "unknown-animal" | "bad-metadata" };

/** Idempotent fulfill for a paid Stripe Checkout session (webhook + confirm). */
export async function fulfillStripeCheckoutSession(session: {
  id: string;
  payment_status?: string;
  metadata?: { rosterId?: string; allocation?: string; amount?: string };
}): Promise<StripeFulfillResult> {
  if (session.payment_status && session.payment_status !== "paid") {
    return { ok: false, reason: "bad-metadata" };
  }

  const existing = await prisma.fundraisingDonation.findUnique({
    where: { stripeSessionId: session.id },
    select: { animalId: true, rosterId: true },
  });
  if (existing) {
    return {
      ok: true,
      alreadyApplied: true,
      rosterId: existing.rosterId,
      animalId: existing.animalId,
    };
  }

  const rosterId = Number(session.metadata?.rosterId);
  const amount = Number(session.metadata?.amount);
  const allocation =
    session.metadata?.allocation === "medical" ? "medical" : "general";
  if (!Number.isInteger(rosterId) || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "bad-metadata" };
  }

  const dog = findCatalogDog(rosterId);
  if (!dog) return { ok: false, reason: "unknown-animal" };
  const animalId = rosterAnimalId(dog.id);
  const restrictionType =
    allocation === "medical" ? "MEDICAL" : "GENERAL_CARE";
  const medicalStatus =
    dog.medicalStatus === "Needs Review" ? "ISOLATION" : "HEALTHY_HOLD";
  const targetAmount = campaignGoal(dog.medicalStatus === "Needs Review");

  try {
    await prisma.$transaction(async (tx) => {
      await ensureFundraisingAnimal(tx, { animalId, dog, medicalStatus });
      await tx.fundraisingDonation.create({
        data: {
          stripeSessionId: session.id,
          animalId,
          rosterId,
          amount,
          allocation: restrictionType,
        },
      });
      await tx.fundraisingWallet.upsert({
        where: { animalId },
        create: {
          animalId,
          targetAmount,
          currentBalance: amount,
          restrictionType,
        },
        update: { currentBalance: { increment: amount } },
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: true, alreadyApplied: true, rosterId, animalId };
    }
    throw err;
  }

  return { ok: true, alreadyApplied: false, rosterId, animalId };
}
