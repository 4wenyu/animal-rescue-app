/**
 * Map Prisma animals onto the public Dog card.
 * `roster-{n}` rows keep the catalog id. Any other animal id (intake UUIDs)
 * is addressed by `publicId` so / and /adopt can link to it.
 */
import type { Dog, EuthanasiaRisk } from "@/src/components/home/types";

export type PublicAnimalRow = {
  animalId: string;
  name: string;
  breedDesignation: string;
  ageYears: number | null;
  sex: string | null;
  personality: string | null;
  imageUrl: string | null;
  city: string | null;
  medicalStatus: string;
  listingStatus: string;
  statutoryHoldCleared: boolean;
  intakeTimestamp: Date;
  strayHoldExpiresAt: Date | null;
};

export function dogProfileId(dog: { id: number; publicId?: string }): string {
  const explicit = dog.publicId?.trim();
  return explicit ? explicit : String(dog.id);
}

export function profileIdFromAnimalId(animalId: string): {
  id: number;
  publicId: string;
} {
  const match = /^roster-(\d+)$/.exec(animalId);
  if (!match) return { id: 0, publicId: animalId };
  const id = Number(match[1]);
  return { id, publicId: String(id) };
}

function riskFromListing(
  status: string,
  fallback: EuthanasiaRisk,
): EuthanasiaRisk {
  if (status === "HOLD") return "AT_RISK";
  return fallback;
}

function sexOf(
  raw: string | null | undefined,
  fallback?: "Male" | "Female",
): "Male" | "Female" | undefined {
  const value = raw?.trim().toLowerCase();
  if (value === "female" || value === "f") return "Female";
  if (value === "male" || value === "m") return "Male";
  return fallback;
}

export function mapPublicAnimal(
  row: PublicAnimalRow,
  catalog: readonly Dog[],
): Dog {
  const { id, publicId } = profileIdFromAnimalId(row.animalId);
  const catalogRow = id > 0 ? catalog.find((dog) => dog.id === id) : undefined;
  const risk = riskFromListing(
    row.listingStatus,
    catalogRow?.euthanasia_risk_status ?? "SAFE",
  );
  const sex = sexOf(row.sex, catalogRow?.sex);

  return {
    id,
    publicId,
    name: row.name.trim() || catalogRow?.name || "Unnamed",
    breed: row.breedDesignation.trim() || catalogRow?.breed || "Mixed Breed",
    age: row.ageYears ?? catalogRow?.age ?? 0,
    medicalStatus: row.medicalStatus === "ISOLATION" ? "Needs Review" : "Healthy",
    euthanasia_risk_status: risk,
    statutoryHoldCleared: row.statutoryHoldCleared,
    intakeTimestamp: row.intakeTimestamp.toISOString(),
    strayHoldExpiresAt: row.strayHoldExpiresAt?.toISOString(),
    imageUrl: row.imageUrl ?? catalogRow?.imageUrl,
    sex,
    personality: row.personality ?? catalogRow?.personality,
    city: row.city?.trim() || catalogRow?.city,
  };
}
