import dogs from "../../../../data/dogs.json";
import type { Dog } from "@/src/components/home/types";
import { MedicalRoster } from "@/src/components/medical/MedicalRoster";

export default function MedicalIntakePage() {
  return (
    <MedicalRoster
      dogs={dogs as Dog[]}
      backHref="/intake"
      backLabelKey="nav.back_to_options"
    />
  );
}
