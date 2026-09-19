import { prisma } from "@/lib/prisma";
import { campaignGoal } from "@/lib/fundraisingDonate";
import { rosterAnimalId } from "@/lib/medicalLog";
import { findCatalogDog } from "@/lib/roster";

const CUSTODIAN_ORG_ID = "f4eedd11-2222-4000-a000-000000000001";

export async function applyFundraisingPledge(input: {
  rosterId: number;
  amount: number;
  allocation: "medical" | "general";
}) {
  const dog = findCatalogDog(input.rosterId);
  if (!dog) return null;
  const animalId = rosterAnimalId(dog.id);
  const restrictionType = input.allocation === "medical" ? "MEDICAL" : "GENERAL_CARE";
  const medicalStatus =
    dog.medicalStatus === "Needs Review" ? "ISOLATION" : "HEALTHY_HOLD";
  const targetAmount = campaignGoal(dog.medicalStatus === "Needs Review");

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
        currentBalance: input.amount,
        restrictionType,
      },
      update: { currentBalance: { increment: input.amount } },
    });
  });

  return { wallet, animalId, dog };
}
