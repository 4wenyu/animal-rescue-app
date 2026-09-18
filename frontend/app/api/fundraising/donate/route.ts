/**
 * POST /api/fundraising/donate
 * Public pledge against a roster animal. Upserts Animal + FundraisingWallet.
 */

import { NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/helpers";
import { campaignGoal, DonateBodySchema } from "@/lib/fundraisingDonate";
import { rosterAnimalId } from "@/lib/medicalLog";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { Dog } from "@/src/components/home/types";

import dogs from "../../../../data/dogs.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { ok: withinLimit, retryAfterSeconds } = checkRateLimit(
    `fundraising-donate:${ip}`,
    10,
    10 * 60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await parseJsonBody(request, DonateBodySchema);
  if (!body.ok) return body.response;

  const dog = (dogs as Dog[]).find((item) => item.id === body.data.rosterId);
  if (!dog) {
    return NextResponse.json(
      { error: "Not Found", message: "That animal is not on the roster." },
      { status: 404 },
    );
  }

  const animalId = rosterAnimalId(dog.id);
  const restrictionType = body.data.allocation === "medical" ? "MEDICAL" : "GENERAL_CARE";
  const medicalStatus =
    dog.medicalStatus === "Needs Review" ? "ISOLATION" : "HEALTHY_HOLD";
  const targetAmount = campaignGoal(dog.medicalStatus === "Needs Review");

  try {
    const wallet = await prisma.$transaction(async (tx) => {
      await tx.organization.upsert({
        where: { orgId: CUSTODIAN_ORG_ID },
        update: {},
        create: {
          orgId: CUSTODIAN_ORG_ID,
          orgType: "MUNICIPAL_SHELTER",
          einNumber: "00-0000000",
        },
      });

      await tx.animal.upsert({
        where: { animalId },
        create: {
          animalId,
          custodianOrgId: CUSTODIAN_ORG_ID,
          breedDesignation: dog.breed,
          intakeTimestamp: new Date(dog.intakeTimestamp),
          medicalStatus,
          name: dog.name,
          species: "Dog",
          ageYears: dog.age,
          imageUrl: dog.imageUrl ?? null,
        },
        update: { name: dog.name },
      });

      return tx.fundraisingWallet.upsert({
        where: { animalId },
        create: {
          animalId,
          targetAmount,
          currentBalance: body.data.amount,
          restrictionType,
        },
        update: {
          currentBalance: { increment: body.data.amount },
        },
      });
    });

    return NextResponse.json(
      { ok: true, balance: Number(wallet.currentBalance), animalId },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unavailable", message: "Could not record this donation." },
      { status: 503 },
    );
  }
}
