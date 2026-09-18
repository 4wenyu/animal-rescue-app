import dogs from "../../../data/dogs.json";
import { campaignGoal } from "@/lib/fundraisingDonate";
import { rosterAnimalId } from "@/lib/medicalLog";
import { prisma } from "@/lib/prisma";
import type { Dog } from "@/src/components/home/types";
import { FundraisingList } from "@/src/components/fundraising/FundraisingList";

export default async function FundraisingPage() {
  const roster = dogs as Dog[];
  const wallets = await prisma.fundraisingWallet.findMany({
    where: { animalId: { in: roster.map((dog) => rosterAnimalId(dog.id)) } },
    select: { animalId: true, currentBalance: true },
  });
  const raisedById = new Map(
    wallets.map((wallet) => [wallet.animalId, Number(wallet.currentBalance)]),
  );

  const campaigns = roster.map((dog) => ({
    ...dog,
    raised: raisedById.get(rosterAnimalId(dog.id)) ?? 0,
    goal: campaignGoal(dog.medicalStatus === "Needs Review"),
  }));

  return <FundraisingList campaigns={campaigns} />;
}
