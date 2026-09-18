import { notFound } from "next/navigation";

import dogs from "../../../../data/dogs.json";
import { campaignGoal } from "@/lib/fundraisingDonate";
import { parseRosterId, rosterAnimalId } from "@/lib/medicalLog";
import { prisma } from "@/lib/prisma";
import type { Dog } from "@/src/components/home/types";
import { FundraisingCampaign } from "@/src/components/fundraising/FundraisingCampaign";

export default async function FundraisingAnimalPage({
  params,
}: {
  params: Promise<{ animalId: string }>;
}) {
  const { animalId } = await params;
  const rosterId = parseRosterId(animalId);
  if (rosterId === null) notFound();

  const dog = (dogs as Dog[]).find((item) => item.id === rosterId);
  if (!dog) notFound();

  const wallet = await prisma.fundraisingWallet.findUnique({
    where: { animalId: rosterAnimalId(dog.id) },
    select: { currentBalance: true },
  });

  return (
    <FundraisingCampaign
      dog={dog}
      goal={campaignGoal(dog.medicalStatus === "Needs Review")}
      currentBalance={wallet ? Number(wallet.currentBalance) : 0}
    />
  );
}
