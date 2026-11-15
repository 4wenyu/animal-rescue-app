import { describe, expect, it } from "vitest";

import { intakeListingData, safePhotoUrl } from "@/lib/intakeListing";
import { adoptionRequestMessage } from "@/lib/services/adoptionInterestNotify";

describe("intake listing fields", () => {
  it("keeps an https photo and city and drops a non-url", () => {
    const listing = intakeListingData({
      name: "  Miso ",
      species: "cat",
      breed: "Domestic Shorthair",
      city: " Riverside ",
      imageUrl: "https://shelter.example/miso.jpg",
      sex: "female",
      age: 2,
      notes: "Found near the wash",
    });

    expect(listing).toMatchObject({
      name: "Miso",
      species: "Cat",
      city: "Riverside",
      imageUrl: "https://shelter.example/miso.jpg",
      sex: "Female",
    });
    expect(safePhotoUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("adoption request notice", () => {
  it("names the animal and the staff queue", () => {
    const text = adoptionRequestMessage({
      animalId: "animal-1",
      animalName: "Miso",
      interestType: "ADOPT",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: null,
    });

    expect(text).toContain("Miso");
    expect(text).toContain("status NEW");
    expect(text).toContain("/staff/adoptions");
    expect(text).not.toContain("Phone:");
  });
});
