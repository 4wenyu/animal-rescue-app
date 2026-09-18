import { notFound } from "next/navigation";

import dogs from "../../../../data/dogs.json";
import { parseRosterId } from "@/lib/medicalLog";
import type { Dog } from "@/src/components/home/types";
import { MedicalExam } from "@/src/components/medical/MedicalExam";

export default async function MedicalExamPage({
  params,
}: {
  params: Promise<{ animalId: string }>;
}) {
  const { animalId } = await params;
  const rosterId = parseRosterId(animalId);
  if (rosterId === null) notFound();

  const dog = (dogs as Dog[]).find((item) => item.id === rosterId);
  if (!dog) notFound();

  return <MedicalExam dog={dog} />;
}
