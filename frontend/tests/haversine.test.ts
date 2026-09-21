import { describe, expect, it } from "vitest";

import {
  distanceMiles,
  isWithinRadiusMiles,
} from "@/lib/geo/haversine";

describe("haversine", () => {
  it("measures ~0 for identical points", () => {
    expect(distanceMiles(34.05, -118.25, 34.05, -118.25)).toBeLessThan(0.01);
  });

  it("puts downtown LA ~11 mi from Santa Monica", () => {
    // Approx: LA City Hall vs Santa Monica Pier
    const mi = distanceMiles(34.0537, -118.2427, 34.0101, -118.4965);
    expect(mi).toBeGreaterThan(10);
    expect(mi).toBeLessThan(16);
  });

  it("respects radius membership", () => {
    expect(
      isWithinRadiusMiles(34.05, -118.25, 34.06, -118.25, 5),
    ).toBe(true);
    expect(
      isWithinRadiusMiles(34.05, -118.25, 35.0, -118.25, 5),
    ).toBe(false);
  });
});
