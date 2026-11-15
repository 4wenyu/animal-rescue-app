/**
 * Public roster: Prisma animals when any public row exists, else the
 * static catalog in data/dogs.json. Intake UUIDs are included, not only
 * roster-{integer} seed ids. The JSON catalog is the empty-database fallback.
 */
import { prisma } from "@/lib/prisma";
import { rosterAnimalId } from "@/lib/medicalLog";
import { mapPublicAnimal, type PublicAnimalRow } from "@/lib/publicRoster";
import type { Dog } from "@/src/components/home/types";
import catalog from "../data/dogs.json";

const CATALOG = catalog as Dog[];

function fromCatalog(): Dog[] {
  return CATALOG.map((dog) => ({ ...dog }));
}

function toPublicRow(row: {
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
}): PublicAnimalRow {
  return row;
}

export async function getPublicRoster(): Promise<Dog[]> {
  try {
    const rows = await prisma.animal.findMany({
      where: { listingStatus: { in: ["AVAILABLE", "HOLD", "PENDING"] } },
      orderBy: { intakeTimestamp: "desc" },
      take: 100,
    });
    const mapped = rows.map((row) => mapPublicAnimal(toPublicRow(row), CATALOG));
    if (mapped.length > 0) return mapped;
  } catch (err) {
    console.warn("[roster] falling back to dogs.json:", err);
  }
  return fromCatalog();
}

export function catalogDogs(): Dog[] {
  return fromCatalog();
}

export function findCatalogDog(id: number): Dog | undefined {
  return CATALOG.find((dog) => dog.id === id);
}

export { rosterAnimalId };
