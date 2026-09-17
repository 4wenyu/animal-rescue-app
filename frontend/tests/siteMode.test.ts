import { describe, expect, it } from "vitest";

import { getSiteMode, isPreviewMode } from "@/lib/siteMode";

describe("getSiteMode", () => {
  it("is preview when unset so accidental deploys stay private", () => {
    expect(getSiteMode(undefined)).toBe("preview");
    expect(isPreviewMode(undefined)).toBe(true);
  });

  it("is preview for any value other than live", () => {
    expect(getSiteMode("")).toBe("preview");
    expect(getSiteMode("preview")).toBe("preview");
    expect(getSiteMode("staging")).toBe("preview");
  });

  it("is live only when explicitly set", () => {
    expect(getSiteMode("live")).toBe("live");
    expect(isPreviewMode("live")).toBe(false);
  });
});
