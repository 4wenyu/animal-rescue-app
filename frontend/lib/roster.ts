/**
 * Public roster: Prisma animals when the shelter has real rows, else the
 * static catalog in data/dogs.json. Dual-write seed keeps both in sync.
 */
import { prisma } from "@/lib/prisma";
import { rosterAnimalId } from "@/lib/medicalLog";
import type { Dog, EuthanasiaRisk } from "@/src/components/home/types";
import catalog from "../data/dogs.json";

const CATALOG = catalog as Dog[];

function riskFromListing(
  status: string,
  fallback: EuthanasiaRisk,
): EuthanasiaRisk {
  if (status === "HOLD") return "AT_RISK";
  return fallback;
}

function fromCatalog(): Dog[] {
  return CATALOG.map((dog) => ({ ...dog }));
}

export async function getPublicRoster(): Promise<Dog[]> {
  try {
    const rows = await prisma.animal.findMany({
      where: { listingStatus: { in: ["AVAILABLE", "HOLD", "PENDING"] } },
      orderBy: { intakeTimestamp: "desc" },
      take: 50,
    });
    const mapped = rows
      .map((row): Dog | null => {
        const match = /^roster-(\d+)$/.exec(row.animalId);
        const id = match ? Number(match[1]) : Number.NaN;
        if (!Number.isInteger(id) || id <= 0) return null;
        const catalogRow = CATALOG.find((dog) => dog.id === id);
        const risk: EuthanasiaRisk =
          catalogRow?.euthanasia_risk_status ??
          riskFromListing(row.listingStatus, "SAFE");
        return {
          id,
          name: row.name,
          breed: row.breedDesignation,
          age: row.ageYears ?? catalogRow?.age ?? 0,
          medicalStatus:
            row.medicalStatus === "ISOLATION" ? "Needs Review" : "Healthy",
          euthanasia_risk_status: risk,
          statutoryHoldCleared: row.statutoryHoldCleared,
          intakeTimestamp: row.intakeTimestamp.toISOString(),
          strayHoldExpiresAt: row.strayHoldExpiresAt?.toISOString(),
          imageUrl: row.imageUrl ?? catalogRow?.imageUrl,
          sex:
            row.sex === "Female" || row.sex === "Male"
              ? row.sex
              : catalogRow?.sex,
          personality: row.personality ?? catalogRow?.personality,
          city: catalogRow?.city,
        };
      })
      .filter((row): row is Dog => row !== null);
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
