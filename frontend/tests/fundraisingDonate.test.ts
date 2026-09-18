import { describe, expect, it } from "vitest";

import { campaignGoal, DonateBodySchema } from "@/lib/fundraisingDonate";

describe("campaignGoal", () => {
  it("sets a higher target for animals that need review", () => {
    expect(campaignGoal(false)).toBe(1500);
    expect(campaignGoal(true)).toBe(2500);
  });
});

describe("DonateBodySchema", () => {
  it("accepts a valid pledge", () => {
    const parsed = DonateBodySchema.parse({
      rosterId: 11,
      amount: 25,
      allocation: "medical",
    });
    expect(parsed.amount).toBe(25);
  });

  it("rejects a zero or negative amount", () => {
    expect(
      DonateBodySchema.safeParse({
        rosterId: 11,
        amount: 0,
        allocation: "general",
      }).success,
    ).toBe(false);
  });
});
