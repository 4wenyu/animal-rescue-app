import { describe, expect, it } from "vitest";

import { mapPublicAnimal, dogProfileId } from "@/lib/publicRoster";
import type { Dog } from "@/src/components/home/types";

const catalog: Dog[] = [
  {
    id: 4,
    name: "Catalog Luna",
    breed: "Beagle",
    age: 2,
    medicalStatus: "Healthy",
    euthanasia_risk_status: "SAFE",
    statutoryHoldCleared: true,
    intakeTimestamp: "2026-01-01T00:00:00.000Z",
    imageUrl: "https://placedog.net/400/400?id=4",
    city: "Harborview",
  },
];

const stamp = new Date("2026-11-01T12:00:00.000Z");

describe("mapPublicAnimal", () => {
  it("publishes an intake animal with its photo, city, and id", () => {
    const dog = mapPublicAnimal(
      {
        animalId: "11111111-2222-4333-8444-555555555555",
        name: "Miso",
        breedDesignation: "Domestic Shorthair",
        ageYears: 3,
        sex: "Female",
        personality: "Quiet",
        imageUrl: "https://shelter.example/miso.jpg",
        city: "Riverside",
        medicalStatus: "HEALTHY_HOLD",
        listingStatus: "AVAILABLE",
        statutoryHoldCleared: false,
        intakeTimestamp: stamp,
        strayHoldExpiresAt: null,
      },
      catalog,
    );

    expect(dogProfileId(dog)).toBe("11111111-2222-4333-8444-555555555555");
    expect(dog.name).toBe("Miso");
    expect(dog.city).toBe("Riverside");
    expect(dog.imageUrl).toBe("https://shelter.example/miso.jpg");
    expect(dog.sex).toBe("Female");
  });

  it("keeps roster seed ids and fills a missing city from the catalog", () => {
    const dog = mapPublicAnimal(
      {
        animalId: "roster-4",
        name: "Luna",
        breedDesignation: "Beagle",
        ageYears: null,
        sex: null,
        personality: null,
        imageUrl: null,
        city: null,
        medicalStatus: "HEALTHY_HOLD",
        listingStatus: "AVAILABLE",
        statutoryHoldCleared: true,
        intakeTimestamp: stamp,
        strayHoldExpiresAt: null,
      },
      catalog,
    );

    expect(dogProfileId(dog)).toBe("4");
    expect(dog.city).toBe("Harborview");
    expect(dog.imageUrl).toBe("https://placedog.net/400/400?id=4");
    expect(dog.age).toBe(2);
  });

  it("prefers a database city over the catalog city", () => {
    const dog = mapPublicAnimal(
      {
        animalId: "roster-4",
        name: "Luna",
        breedDesignation: "Beagle",
        ageYears: 2,
        sex: "Female",
        personality: null,
        imageUrl: "https://shelter.example/luna.jpg",
        city: "San Bernardino",
        medicalStatus: "HEALTHY_HOLD",
        listingStatus: "HOLD",
        statutoryHoldCleared: false,
        intakeTimestamp: stamp,
        strayHoldExpiresAt: null,
      },
      catalog,
    );

    expect(dog.city).toBe("San Bernardino");
    expect(dog.imageUrl).toBe("https://shelter.example/luna.jpg");
    expect(dog.euthanasia_risk_status).toBe("AT_RISK");
  });
});
