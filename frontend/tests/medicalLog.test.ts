import { describe, expect, it } from "vitest";

import {
  examMedState,
  MedicalLogBodySchema,
  parseRosterId,
  rosterAnimalId,
} from "@/lib/medicalLog";

describe("roster animal ids", () => {
  it("prefixes a stable ledger id", () => {
    expect(rosterAnimalId(12)).toBe("roster-12");
  });

  it("parses a numeric route segment and rejects junk", () => {
    expect(parseRosterId("12")).toBe(12);
    expect(parseRosterId("DOG-A001")).toBeNull();
    expect(parseRosterId("0")).toBeNull();
  });
});

describe("exam medical state", () => {
  it("isolates animals that need review or show emergency signs", () => {
    expect(examMedState(true, 0)).toBe("ISOLATION");
    expect(examMedState(false, 1)).toBe("ISOLATION");
    expect(examMedState(false, 0)).toBe("HEALTHY_HOLD");
  });
});

describe("MedicalLogBodySchema", () => {
  const valid = {
    rosterId: 2,
    weightLbs: 41.5,
    tpr: { temperatureF: 101.2, pulse: 90, respiration: 24 },
    microchipScanned: true,
    vaccinesAdministered: [],
    dewormerAdministered: [],
    emergencySignsNoted: ["vomiting"],
  };

  it("accepts a complete TPR payload", () => {
    expect(MedicalLogBodySchema.parse(valid).rosterId).toBe(2);
  });

  it("rejects a missing roster id", () => {
    const parsed = MedicalLogBodySchema.safeParse({ ...valid, rosterId: 0 });
    expect(parsed.success).toBe(false);
  });
});
