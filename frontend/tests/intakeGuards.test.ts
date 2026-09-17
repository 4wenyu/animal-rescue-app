import { describe, expect, it } from "vitest";

import {
  MAX_INTAKE_BONUSES_PER_DAY,
  normalizeEsignHash,
  remainingIntakeBonusBudget,
} from "@/lib/intakeGuards";

describe("remainingIntakeBonusBudget", () => {
  it("starts at the daily cap when nothing has been minted", () => {
    expect(remainingIntakeBonusBudget(0)).toBe(MAX_INTAKE_BONUSES_PER_DAY);
  });

  it("shrinks as the caller mints and floors at zero past the cap", () => {
    expect(remainingIntakeBonusBudget(10)).toBe(MAX_INTAKE_BONUSES_PER_DAY - 10);
    expect(remainingIntakeBonusBudget(MAX_INTAKE_BONUSES_PER_DAY)).toBe(0);
    expect(remainingIntakeBonusBudget(MAX_INTAKE_BONUSES_PER_DAY + 4)).toBe(0);
  });
});

describe("normalizeEsignHash", () => {
  it("returns null for missing or blank headers", () => {
    expect(normalizeEsignHash(null)).toBeNull();
    expect(normalizeEsignHash(undefined)).toBeNull();
    expect(normalizeEsignHash("")).toBeNull();
    expect(normalizeEsignHash("   ")).toBeNull();
  });

  it("trims a real SHA-256 hex so retries match the stored row", () => {
    const hash = "a".repeat(64);
    expect(normalizeEsignHash(` ${hash} `)).toBe(hash);
  });
});
