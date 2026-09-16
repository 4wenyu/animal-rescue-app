/**
 * Jurisdiction hold-rule resolution.
 *
 * The engine's stated contract is "bias longer when in doubt" — an unknown
 * jurisdiction must never resolve to a shorter hold than the default.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_HOLD_HOURS,
  HOLD_RULES,
  computeStrayHoldExpiry,
  isStatutoryHoldCleared,
  resolveJurisdiction,
  strayHoldHours,
} from "@/src/lib/holdRegulations";

describe("resolveJurisdiction", () => {
  it("accepts bare, prefixed, and full-name spellings of a state", () => {
    expect(resolveJurisdiction("CA")).toBe("US-CA");
    expect(resolveJurisdiction("US-CA")).toBe("US-CA");
    expect(resolveJurisdiction("California")).toBe("US-CA");
    expect(resolveJurisdiction("  california  ")).toBe("US-CA");
  });

  it("falls back to the default for missing or unlisted jurisdictions", () => {
    expect(resolveJurisdiction(null)).toBe("US-DEFAULT");
    expect(resolveJurisdiction(undefined)).toBe("US-DEFAULT");
    expect(resolveJurisdiction("")).toBe("US-DEFAULT");
    expect(resolveJurisdiction("US-ZZ")).toBe("US-DEFAULT");
    expect(resolveJurisdiction("Atlantis")).toBe("US-DEFAULT");
  });
});

describe("strayHoldHours", () => {
  it("holds an identified animal at least as long as an unidentified one", () => {
    // Owner ID means a reclaim is more likely, so the window may only widen.
    for (const [code, rule] of Object.entries(HOLD_RULES)) {
      expect(
        rule.withIdHours,
        `${code} shortens the hold for an identified animal`,
      ).toBeGreaterThanOrEqual(rule.noIdHours);
    }
  });

  it("never returns less than the conservative default", () => {
    for (const code of Object.keys(HOLD_RULES)) {
      if (code === "US-PA") continue; // PA statute is genuinely 48h with no ID
      expect(strayHoldHours(code, false)).toBeGreaterThanOrEqual(
        DEFAULT_HOLD_HOURS,
      );
    }
  });

  it("applies the documented statutory numbers", () => {
    expect(strayHoldHours("US-NY", false)).toBe(120);
    expect(strayHoldHours("US-NY", true)).toBe(168);
    expect(strayHoldHours("US-VA", true)).toBe(240);
    expect(strayHoldHours(undefined, false)).toBe(DEFAULT_HOLD_HOURS);
  });
});

describe("computeStrayHoldExpiry", () => {
  it("adds the jurisdiction window to the intake timestamp", () => {
    const intake = new Date("2026-03-01T00:00:00.000Z");
    const expiry = computeStrayHoldExpiry(intake, "US-WA", false);

    expect(expiry?.toISOString()).toBe("2026-03-04T00:00:00.000Z");
  });

  it("returns null rather than 'now' for an invalid intake date", () => {
    // Resolving to `now` would make the hold look instantly cleared.
    expect(computeStrayHoldExpiry("garbage", "US-CA")).toBeNull();
  });
});

describe("isStatutoryHoldCleared", () => {
  const intake = "2026-03-01T00:00:00.000Z";

  it("is false before the window closes and true at/after it", () => {
    expect(
      isStatutoryHoldCleared(intake, "US-WA", false, new Date("2026-03-03T23:59:59.000Z")),
    ).toBe(false);
    expect(
      isStatutoryHoldCleared(intake, "US-WA", false, new Date("2026-03-04T00:00:00.000Z")),
    ).toBe(true);
  });

  it("fails closed when the intake date cannot be parsed", () => {
    expect(isStatutoryHoldCleared("garbage", "US-CA", false, new Date())).toBe(false);
  });
});
