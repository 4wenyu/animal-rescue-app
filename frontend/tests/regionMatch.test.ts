import { describe, expect, it } from "vitest";

import { regionMatchNote, regionTokens, regionsOverlap } from "@/lib/services/regionMatch";

describe("region matching", () => {
  it("tokenizes punctuation and case", () => {
    expect(regionTokens("Harborview, CA")).toEqual(["harborview", "ca"]);
  });

  it("overlaps when a token is shared", () => {
    expect(regionsOverlap("Harborview CA", "harborview")).toBe(true);
  });

  it("does not overlap distinct cities", () => {
    expect(regionsOverlap("Harborview", "Oakland")).toBe(false);
  });

  it("skips filtering when either side is blank", () => {
    expect(regionsOverlap("Harborview", null)).toBe(true);
    expect(regionsOverlap("", "Harborview")).toBe(true);
  });

  it("explains the match honestly", () => {
    expect(regionMatchNote("Harborview", "Harborview")).toContain("matched");
    expect(regionMatchNote("Harborview", null)).toContain("skipped");
  });
});
