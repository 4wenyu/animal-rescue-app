import { describe, expect, it } from "vitest";

import { matchPublicRoster, type RosterCandidate } from "@/lib/services/rosterMatch";

const animals: RosterCandidate[] = [
  {
    animalId: "roster-7",
    name: "Maple",
    species: "Dog",
    breed: "Labrador Retriever",
    city: "Harborview",
    imageUrl: "https://shelter.example/maple.jpg",
    personality: "Black coat, good with kids",
    story: null,
  },
  {
    animalId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    name: "Nori",
    species: "Cat",
    breed: "Domestic Shorthair",
    city: "Riverside",
    imageUrl: null,
    personality: "Orange tabby",
    story: null,
  },
];

describe("matchPublicRoster", () => {
  it("returns the shelter dog that shares species, breed, color, and city", () => {
    const hits = matchPublicRoster(
      {
        species: "dog",
        breed: "Labrador",
        colorMarkings: "black",
        lastSeen: "Harborview park",
      },
      animals,
    );

    expect(hits.map((hit) => hit.name)).toEqual(["Maple"]);
    expect(hits[0]?.profileId).toBe("7");
    expect(hits[0]?.imageUrl).toBe("https://shelter.example/maple.jpg");
    expect(hits[0]?.city).toBe("Harborview");
  });

  it("skips a different species and a breed that does not overlap", () => {
    const hits = matchPublicRoster(
      {
        species: "dog",
        breed: "Poodle",
        colorMarkings: null,
        lastSeen: "Harborview",
      },
      animals,
    );

    expect(hits).toEqual([]);
  });

  it("does not treat a cat report as a dog, and keeps an intake id", () => {
    const hits = matchPublicRoster(
      {
        species: "cat",
        breed: null,
        colorMarkings: "orange",
        lastSeen: "Riverside",
      },
      animals,
    );

    expect(hits).toHaveLength(1);
    expect(hits[0]?.profileId).toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
  });

  it("drops a hit when the city disagrees", () => {
    const hits = matchPublicRoster(
      {
        species: "dog",
        breed: "Labrador",
        colorMarkings: "black",
        lastSeen: "San Diego",
      },
      animals,
    );

    expect(hits).toEqual([]);
  });
});
