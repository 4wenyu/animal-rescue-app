import dogs from "../../../data/dogs.json";
import type { Dog } from "@/src/components/home/types";
import { MedicalRoster } from "@/src/components/medical/MedicalRoster";

export default function MedicalRecordsPage() {
  return (
    <MedicalRoster
      dogs={dogs as Dog[]}
      backHref="/dashboard"
      backLabelKey="medical.back_to_dashboard"
    />
  );
}
