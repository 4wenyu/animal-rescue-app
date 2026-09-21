import type { Prisma } from "@prisma/client";

import type { findCatalogDog } from "@/lib/roster";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

export async function ensureFundraisingAnimal(
  tx: Prisma.TransactionClient,
  args: {
    animalId: string;
    dog: NonNullable<ReturnType<typeof findCatalogDog>>;
    medicalStatus: "ISOLATION" | "HEALTHY_HOLD";
  },
) {
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
    where: { animalId: args.animalId },
    create: {
      animalId: args.animalId,
      custodianOrgId: CUSTODIAN_ORG_ID,
      breedDesignation: args.dog.breed,
      intakeTimestamp: new Date(args.dog.intakeTimestamp),
      medicalStatus: args.medicalStatus,
      name: args.dog.name,
      species: "Dog",
      ageYears: args.dog.age,
      imageUrl: args.dog.imageUrl ?? null,
    },
    update: { name: args.dog.name },
  });
}
