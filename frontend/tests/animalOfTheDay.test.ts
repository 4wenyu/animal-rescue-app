import { describe, expect, it } from "vitest";

import { animalOfTheDay, animalOfTomorrow } from "@/lib/animalOfTheDay";

const dogs = [
  { id: 1, euthanasia_risk_status: "SAFE" as const },
  { id: 2, euthanasia_risk_status: "IMMEDIATE_BEHAVIORAL" as const },
  { id: 3, euthanasia_risk_status: "AT_RISK" as const },
];

describe("animal of the day", () => {
  it("picks the same adoptable animal for the same calendar day", () => {
    const a = animalOfTheDay(dogs, new Date("2026-09-17T08:00:00"));
    const b = animalOfTheDay(dogs, new Date("2026-09-17T23:00:00"));
    expect(a?.id).toBe(b?.id);
    expect(a?.id).not.toBe(2);
  });

  it("can pick a different animal tomorrow", () => {
    const today = animalOfTheDay(dogs, new Date("2026-09-17T12:00:00"));
    const tomorrow = animalOfTomorrow(dogs, new Date("2026-09-17T12:00:00"));
    expect(tomorrow?.id).not.toBe(2);
    expect([1, 3]).toContain(today?.id);
    expect([1, 3]).toContain(tomorrow?.id);
  });
});
