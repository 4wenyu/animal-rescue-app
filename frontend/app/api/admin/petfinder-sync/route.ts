import { NextResponse } from "next/server";

import { requireRole } from "@/lib/api/helpers";
import { prisma } from "@/lib/prisma";
import {
  fetchPetfinderAnimals,
  petfinderConfigured,
  petfinderRosterId,
} from "@/lib/services/petfinderIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

export async function POST() {
  const gate = await requireRole("STAFF", "ADMIN");
  if (!gate.ok) return gate.response;

  if (!petfinderConfigured()) {
    return NextResponse.json(
      {
        error: "Not Configured",
        message:
          "Set PETFINDER_CLIENT_ID and PETFINDER_CLIENT_SECRET to ingest listings.",
      },
      { status: 503 },
    );
  }

  try {
    const animals = await fetchPetfinderAnimals(20);
    await prisma.organization.upsert({
      where: { orgId: CUSTODIAN_ORG_ID },
      update: {},
      create: {
        orgId: CUSTODIAN_ORG_ID,
        orgType: "MUNICIPAL_SHELTER",
        einNumber: "00-0000000",
      },
    });
    let upserted = 0;
    for (const animal of animals) {
      const animalId = petfinderRosterId(animal.id);
      await prisma.animal.upsert({
        where: { animalId },
        create: {
          animalId,
          custodianOrgId: CUSTODIAN_ORG_ID,
          breedDesignation: animal.breed,
          name: animal.name,
          species: animal.species,
          sex: animal.gender === "Female" ? "Female" : animal.gender === "Male" ? "Male" : null,
          personality: animal.description?.slice(0, 240) ?? null,
          imageUrl: animal.photo,
          listingStatus: "AVAILABLE",
          medicalStatus: "HEALTHY_HOLD",
          statutoryHoldCleared: true,
        },
        update: {
          name: animal.name,
          breedDesignation: animal.breed,
          imageUrl: animal.photo,
        },
      });
      upserted += 1;
    }
    return NextResponse.json({ ok: true, upserted });
  } catch (err) {
    console.error("[api/admin/petfinder-sync]", err);
    return NextResponse.json(
      { error: "Bad Gateway", message: "Petfinder ingest failed." },
      { status: 502 },
    );
  }
}
