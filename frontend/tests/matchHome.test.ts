import { describe, expect, it } from "vitest";

import { matchHome, scoreDog, type MatchAnswers } from "@/src/components/home/matchHome";
import type { Dog } from "@/src/components/home/types";

const base = (over: Partial<Dog> & Pick<Dog, "id" | "name" | "breed">): Dog => ({
  age: 3,
  medicalStatus: "Healthy",
  euthanasia_risk_status: "SAFE",
  statutoryHoldCleared: true,
  intakeTimestamp: "2026-01-01T00:00:00.000Z",
  ...over,
});

const trail: MatchAnswers = { pace: "trail", space: "yard", household: "kids" };

describe("who-needs-a-home matcher", () => {
  it("never returns an animal under behavioral evaluation", () => {
    const held = base({
      id: 2,
      name: "Max",
      breed: "German Shepherd",
      euthanasia_risk_status: "IMMEDIATE_BEHAVIORAL",
    });
    const buddy = base({ id: 1, name: "Buddy", breed: "Golden Retriever" });
    expect(matchHome([held, buddy], trail).map((d) => d.name)).toEqual(["Buddy"]);
    expect(scoreDog(held, trail)).toBe(Number.NEGATIVE_INFINITY);
  });

  it("prefers a calm senior for quiet + apartment + solo", () => {
    const lola = base({ id: 12, name: "Lola", breed: "Shih Tzu", age: 8 });
    const luna = base({ id: 4, name: "Luna", breed: "Siberian Husky", age: 1 });
    const [top] = matchHome(
      [luna, lola],
      { pace: "calm", space: "apt", household: "solo" },
      1,
    );
    expect(top.name).toBe("Lola");
  });
});
