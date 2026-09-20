import { describe, expect, it } from "vitest";

import { SEARCH_FEE_AMOUNT } from "@/lib/services/sponsorSearchGrant";
import {
  hasAnyLlmKey,
  normalizeTeamoBaseUrl,
  TEAMOROUTER_DEFAULT_BASE_URL,
} from "@/lib/llm/provider";

describe("sponsor-funded search", () => {
  it("underwrites exactly one search fee", () => {
    expect(SEARCH_FEE_AMOUNT).toBe(100);
  });
});

describe("LLM gateways", () => {
  it("reports whether any compute key is present", () => {
    expect(typeof hasAnyLlmKey()).toBe("boolean");
  });

  it("rewrites the .cc typo and appends /v1", () => {
    expect(normalizeTeamoBaseUrl(undefined)).toBe(TEAMOROUTER_DEFAULT_BASE_URL);
    expect(normalizeTeamoBaseUrl("https://api.teamorouter.cc")).toBe(
      TEAMOROUTER_DEFAULT_BASE_URL,
    );
    expect(normalizeTeamoBaseUrl("https://api.teamorouter.cc/v1")).toBe(
      TEAMOROUTER_DEFAULT_BASE_URL,
    );
    expect(normalizeTeamoBaseUrl("https://api.teamorouter.com")).toBe(
      TEAMOROUTER_DEFAULT_BASE_URL,
    );
  });
});
