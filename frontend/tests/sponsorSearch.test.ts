import { describe, expect, it } from "vitest";

import { SEARCH_FEE_AMOUNT } from "@/lib/services/sponsorSearchGrant";
import { hasAnyLlmKey } from "@/lib/llm/provider";

describe("sponsor-funded search", () => {
  it("underwrites exactly one search fee", () => {
    expect(SEARCH_FEE_AMOUNT).toBe(100);
  });
});

describe("LLM gateways", () => {
  it("reports whether any compute key is present", () => {
    expect(typeof hasAnyLlmKey()).toBe("boolean");
  });
});
