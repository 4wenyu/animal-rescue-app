/**
 * Optional Petfinder Partners API ingest (Epic 4 foundation).
 * Requires PETFINDER_CLIENT_ID + PETFINDER_CLIENT_SECRET. No keys → no calls.
 */
import { rosterAnimalId } from "@/lib/medicalLog";

const TOKEN_URL = "https://api.petfinder.com/v2/oauth2/token";
const ANIMALS_URL = "https://api.petfinder.com/v2/animals";

export type PetfinderAnimalStub = {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string | null;
  gender: string | null;
  description: string | null;
  photo: string | null;
};

export function petfinderConfigured(): boolean {
  return Boolean(
    process.env.PETFINDER_CLIENT_ID?.trim() &&
      process.env.PETFINDER_CLIENT_SECRET?.trim(),
  );
}

async function accessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.PETFINDER_CLIENT_ID!.trim(),
    client_secret: process.env.PETFINDER_CLIENT_SECRET!.trim(),
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Petfinder token failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Petfinder token missing");
  return json.access_token;
}

export async function fetchPetfinderAnimals(limit = 20): Promise<PetfinderAnimalStub[]> {
  const token = await accessToken();
  const url = new URL(ANIMALS_URL);
  url.searchParams.set("limit", String(Math.min(100, Math.max(1, limit))));
  url.searchParams.set("status", "adoptable");
  const org = process.env.PETFINDER_ORG_ID?.trim();
  if (org) url.searchParams.set("organization", org);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Petfinder animals failed (${res.status})`);
  const json = (await res.json()) as {
    animals?: Array<{
      id: number;
      name?: string;
      species?: string;
      breeds?: { primary?: string };
      age?: string;
      gender?: string;
      description?: string;
      photos?: Array<{ medium?: string; large?: string }>;
    }>;
  };
  return (json.animals ?? []).map((animal) => ({
    id: animal.id,
    name: animal.name ?? "Unnamed",
    species: animal.species ?? "Dog",
    breed: animal.breeds?.primary ?? "Mixed Breed",
    age: animal.age ?? null,
    gender: animal.gender ?? null,
    description: animal.description ?? null,
    photo: animal.photos?.[0]?.large ?? animal.photos?.[0]?.medium ?? null,
  }));
}

export function petfinderRosterId(petfinderId: number): string {
  return rosterAnimalId(petfinderId);
}
