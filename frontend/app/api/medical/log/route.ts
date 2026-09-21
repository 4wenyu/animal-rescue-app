/**
 * POST /api/medical/log
 * Staff TPR exam → Animal upsert (roster-{id}) + MedicalLog row.
 */

import { NextResponse } from "next/server";

import { parseJsonBody, requireRole } from "@/lib/api/helpers";
import {
  examMedState,
  MedicalLogBodySchema,
  rosterAnimalId,
} from "@/lib/medicalLog";
import { prisma } from "@/lib/prisma";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import type { Dog } from "@/src/components/home/types";

import dogs from "../../../../data/dogs.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

export async function POST(request: Request) {
  const gate = await requireRole("STAFF", "ADMIN");
  if (!gate.ok) return gate.response;

  const { ok: withinLimit, retryAfterSeconds } = await checkRateLimitAsync(
    `medical-log:${gate.user.id}`,
    30,
    10 * 60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await parseJsonBody(request, MedicalLogBodySchema);
  if (!body.ok) return body.response;

  const dog = (dogs as Dog[]).find((item) => item.id === body.data.rosterId);
  if (!dog) {
    return NextResponse.json(
      { error: "Not Found", message: "That animal is not on the intake roster." },
      { status: 404 },
    );
  }

  const animalId = rosterAnimalId(dog.id);
  const medicalStatus = examMedState(
    dog.medicalStatus === "Needs Review",
    body.data.emergencySignsNoted.length,
  );

  try {
    const log = await prisma.$transaction(async (tx) => {
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
          sex: dog.sex ?? null,
          personality: dog.personality ?? null,
          imageUrl: dog.imageUrl ?? null,
        },
        update: {
          medicalStatus,
          name: dog.name,
          breedDesignation: dog.breed,
        },
      });

      return tx.medicalLog.create({
        data: {
          animalId,
          weightLbs: body.data.weightLbs,
          tempPulseResp: body.data.tpr,
          microchipScanned: body.data.microchipScanned,
          vaccinesAdministered: body.data.vaccinesAdministered,
          dewormerAdministered: body.data.dewormerAdministered,
          emergencySignsNoted: body.data.emergencySignsNoted,
        },
      });
    });

    return NextResponse.json({ ok: true, logId: log.logId, animalId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unavailable", message: "Could not save this exam." },
      { status: 503 },
    );
  }
}
