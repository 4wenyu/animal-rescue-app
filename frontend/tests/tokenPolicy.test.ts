/**
 * Token ledger input policy.
 *
 * The ledger is the product's money. These assertions pin the invariants the
 * API layer relies on: amounts are positive integers, the direction is not
 * inferable from a client-supplied sign, and the search fee is a single
 * constant rather than a number duplicated per call site.
 */
import { describe, expect, it } from "vitest";

import {
  TokenTransactionDataSchema,
  ViralShareVerificationCreateSchema,
} from "@/lib/schemas/token";
import {
  FREE_SEARCH_GRANT_AMOUNT,
  FREE_SEARCH_MILESTONE,
  SEARCH_FEE_AMOUNT,
} from "@/lib/services/tokenService";

const VALID_UUID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

function txn(overrides: Record<string, unknown> = {}) {
  return {
    userId: VALID_UUID,
    direction: "SPEND",
    actionType: "LOST_PET_SEARCH_SPEND",
    amount: 100,
    idempotencyKey: "search-activation-1",
    ...overrides,
  };
}

describe("TokenTransactionDataSchema", () => {
  it("accepts a well-formed spend and defaults the currency", () => {
    const parsed = TokenTransactionDataSchema.parse(txn());

    expect(parsed.amount).toBe(100);
    expect(parsed.currency).toBe("USD");
  });

  it.each([
    ["zero", 0],
    ["negative", -100],
    ["fractional", 12.5],
  ])("rejects a %s amount", (_label, amount) => {
    expect(TokenTransactionDataSchema.safeParse(txn({ amount })).success).toBe(false);
  });

  it("rejects a non-UUID userId", () => {
    expect(
      TokenTransactionDataSchema.safeParse(txn({ userId: "admin" })).success,
    ).toBe(false);
  });

  it("rejects an unknown direction or action type", () => {
    expect(
      TokenTransactionDataSchema.safeParse(txn({ direction: "MINT" })).success,
    ).toBe(false);
    expect(
      TokenTransactionDataSchema.safeParse(txn({ actionType: "FREE_MONEY_EARN" }))
        .success,
    ).toBe(false);
  });

  it("requires a non-empty idempotency key", () => {
    expect(
      TokenTransactionDataSchema.safeParse(txn({ idempotencyKey: "" })).success,
    ).toBe(false);
    expect(
      TokenTransactionDataSchema.safeParse(txn({ idempotencyKey: "x".repeat(256) }))
        .success,
    ).toBe(false);
  });
});

describe("search fee constants", () => {
  it("prices the sponsor grant to exactly cover one search", () => {
    // If these drift apart, a sponsor-funded user either cannot afford the
    // search they were just granted, or keeps leftover tokens per search.
    expect(FREE_SEARCH_GRANT_AMOUNT).toBe(SEARCH_FEE_AMOUNT);
  });

  it("keeps the share milestone at the advertised ten groups", () => {
    expect(FREE_SEARCH_MILESTONE).toBe(10);
  });

  it("is a positive integer", () => {
    expect(Number.isInteger(SEARCH_FEE_AMOUNT)).toBe(true);
    expect(SEARCH_FEE_AMOUNT).toBeGreaterThan(0);
  });
});

describe("ViralShareVerificationCreateSchema", () => {
  function share(overrides: Record<string, unknown> = {}) {
    return {
      userId: VALID_UUID,
      platform: "FACEBOOK_GROUP",
      platformPostId: "post-1234567890",
      ...overrides,
    };
  }

  it("defaults a new share to PENDING", () => {
    // A client must never be able to create a share that is already trusted;
    // VERIFIED is a staff decision.
    expect(ViralShareVerificationCreateSchema.parse(share()).status).toBe("PENDING");
  });

  it("rejects an unknown platform", () => {
    expect(
      ViralShareVerificationCreateSchema.safeParse(share({ platform: "MYSPACE" }))
        .success,
    ).toBe(false);
  });

  it("requires a plausible platform post id", () => {
    expect(
      ViralShareVerificationCreateSchema.safeParse(share({ platformPostId: "short" }))
        .success,
    ).toBe(false);
  });

  it("rejects a non-URL content url", () => {
    expect(
      ViralShareVerificationCreateSchema.safeParse(share({ contentUrl: "not a url" }))
        .success,
    ).toBe(false);
  });
});
