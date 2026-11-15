/**
 * Fields copied from a citizen or staff intake payload onto the Animal row
 * so the public feed can show the animal that was actually created.
 */
import type { PetIntake } from "@/lib/schemas/intake";

const SPECIES_LABEL: Record<string, string> = {
  dog: "Dog",
  cat: "Cat",
  rabbit: "Rabbit",
  turtle: "Turtle",
  bird: "Bird",
  small_mammal: "Small mammal",
  reptile: "Reptile",
  fish: "Fish",
  other: "Other",
};

/** Keep http(s) photo links. Drop anything else — we do not store files. */
export function safePhotoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

function clip(raw: string | null | undefined, max: number): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function intakeListingData(record: PetIntake) {
  const speciesKey = record.species?.trim().toLowerCase() ?? "";
  const sex =
    record.sex === "female" ? "Female" : record.sex === "male" ? "Male" : null;

  return {
    name: clip(record.name, 80) ?? "Unnamed",
    species: SPECIES_LABEL[speciesKey] ?? "Dog",
    ageYears: record.age ?? null,
    sex,
    personality: clip(record.notes, 240),
    imageUrl: safePhotoUrl(record.imageUrl),
    city: clip(record.city, 80),
    breedDesignation: clip(record.breed, 80) ?? "Mixed Breed",
  };
}
