/**
 * Compare a lost-pet report with this shelter's public Animal rows.
 * Demo dogs.json is not a roster and is never searched.
 */
import { prisma } from "@/lib/prisma";
import { profileIdFromAnimalId } from "@/lib/publicRoster";
import { regionTokens, regionsOverlap } from "@/lib/services/regionMatch";

export type RosterReport = {
  species: string | null;
  breed: string | null;
  colorMarkings: string | null;
  lastSeen: string | null;
};

export type RosterCandidate = {
  animalId: string;
  name: string;
  species: string;
  breed: string;
  city: string | null;
  imageUrl: string | null;
  personality: string | null;
  story: string | null;
};

export type RosterHit = {
  animalId: string;
  profileId: string;
  name: string;
  species: string;
  breed: string;
  city: string | null;
  imageUrl: string | null;
};

const BREED_STOP = new Set([
  "mixed",
  "breed",
  "unknown",
  "mix",
  "and",
  "the",
  "dog",
  "cat",
]);

const COLOR_WORDS = new Set([
  "black",
  "white",
  "brown",
  "tan",
  "gold",
  "golden",
  "gray",
  "grey",
  "orange",
  "red",
  "cream",
  "brindle",
  "spotted",
  "tabby",
  "calico",
  "blue",
  "silver",
  "yellow",
  "chocolate",
  "sable",
]);

const SPECIES_ALIASES: [string, string][] = [
  ["small mammal", "small_mammal"],
  ["puppy", "dog"],
  ["canine", "dog"],
  ["kitten", "cat"],
  ["feline", "cat"],
  ["bunny", "rabbit"],
  ["dog", "dog"],
  ["cat", "cat"],
  ["rabbit", "rabbit"],
  ["turtle", "turtle"],
  ["bird", "bird"],
  ["reptile", "reptile"],
  ["fish", "fish"],
];

function speciesKey(raw: string | null | undefined): string {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return "";
  for (const [needle, key] of SPECIES_ALIASES) {
    if (text === needle || text.includes(needle)) return key;
  }
  return text;
}

function words(raw: string | null | undefined): string[] {
  return (raw ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && !BREED_STOP.has(part));
}

function breedsCompatible(
  reportBreed: string | null,
  animalBreed: string,
): boolean {
  const report = words(reportBreed);
  const animal = words(animalBreed);
  if (report.length === 0 || animal.length === 0) return true;
  return report.some((token) => animal.includes(token));
}

function colorWords(raw: string | null | undefined): string[] {
  return words(raw).filter((token) => COLOR_WORDS.has(token));
}

function colorsCompatible(
  reportColor: string | null,
  animalText: string,
): boolean {
  const report = colorWords(reportColor);
  if (report.length === 0) return true;
  const animal = colorWords(animalText);
  if (animal.length === 0) return true;
  return report.some((token) => animal.includes(token));
}

function placeCompatible(lastSeen: string | null, city: string | null): boolean {
  if (regionTokens(lastSeen).length === 0 || regionTokens(city).length === 0) {
    return true;
  }
  return regionsOverlap(lastSeen, city);
}

/** Species is required. Breed, color, and city exclude only when both sides disagree. */
export function matchPublicRoster(
  report: RosterReport,
  animals: readonly RosterCandidate[],
): RosterHit[] {
  const wanted = speciesKey(report.species);
  if (!wanted) return [];

  const hits: RosterHit[] = [];
  for (const animal of animals) {
    if (speciesKey(animal.species) !== wanted) continue;
    if (!breedsCompatible(report.breed, animal.breed)) continue;
    const description = [animal.personality, animal.story, animal.breed, animal.name]
      .filter((part): part is string => Boolean(part))
      .join(" ");
    if (!colorsCompatible(report.colorMarkings, description)) continue;
    if (!placeCompatible(report.lastSeen, animal.city)) continue;
    const { publicId } = profileIdFromAnimalId(animal.animalId);
    hits.push({
      animalId: animal.animalId,
      profileId: publicId,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      city: animal.city,
      imageUrl: animal.imageUrl,
    });
    if (hits.length >= 12) break;
  }
  return hits;
}

export async function rosterHitsForSearch(report: RosterReport): Promise<RosterHit[]> {
  try {
    const rows = await prisma.animal.findMany({
      where: { listingStatus: { in: ["AVAILABLE", "HOLD", "PENDING"] } },
      orderBy: { intakeTimestamp: "desc" },
      take: 100,
      select: {
        animalId: true,
        name: true,
        species: true,
        breedDesignation: true,
        city: true,
        imageUrl: true,
        personality: true,
        story: true,
      },
    });
    return matchPublicRoster(
      report,
      rows.map((row) => ({
        animalId: row.animalId,
        name: row.name,
        species: row.species,
        breed: row.breedDesignation,
        city: row.city,
        imageUrl: row.imageUrl,
        personality: row.personality,
        story: row.story,
      })),
    );
  } catch (err) {
    console.warn("[roster-match] public roster unavailable:", err);
    return [];
  }
}

export async function attachRosterMatches<T extends RosterReport>(
  search: T,
): Promise<T & { rosterMatches: RosterHit[] }> {
  const rosterMatches = await rosterHitsForSearch(search);
  return { ...search, rosterMatches };
}
