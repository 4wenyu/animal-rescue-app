import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

import { verifyStripeWebhookSignature } from "@/lib/stripeWebhook";

describe("verifyStripeWebhookSignature", () => {
  const secret = "whsec_test_secret";
  const body = '{"id":"evt_1"}';

  it("accepts a valid signature", () => {
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", secret)
      .update(`${t}.${body}`)
      .digest("hex");
    expect(
      verifyStripeWebhookSignature(body, `t=${t},v1=${v1}`, secret),
    ).toBe(true);
  });

  it("rejects bad signature or stale timestamp", () => {
    const t = Math.floor(Date.now() / 1000) - 10_000;
    const v1 = createHmac("sha256", secret)
      .update(`${t}.${body}`)
      .digest("hex");
    expect(
      verifyStripeWebhookSignature(body, `t=${t},v1=${v1}`, secret),
    ).toBe(false);
    expect(
      verifyStripeWebhookSignature(body, `t=${Math.floor(Date.now() / 1000)},v1=dead`, secret),
    ).toBe(false);
  });
});
