import { describe, expect, it } from "vitest";

import { normalizePhoneE164 } from "@/lib/sms/phone";
import { buildOutreachSms } from "@/lib/sms/twilio";

describe("normalizePhoneE164", () => {
  it("accepts US local and E.164", () => {
    expect(normalizePhoneE164("(951) 555-0100")).toBe("+19515550100");
    expect(normalizePhoneE164("19515550100")).toBe("+19515550100");
    expect(normalizePhoneE164("+44 7700 900123")).toBe("+447700900123");
  });

  it("rejects junk and treats blank as clear", () => {
    expect(normalizePhoneE164("")).toBeNull();
    expect(normalizePhoneE164("123")).toBeNull();
    expect(normalizePhoneE164("not-a-phone")).toBeNull();
  });
});

describe("buildOutreachSms", () => {
  it("adds staff disclosure and an absolute radar link", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://animal-rescue-app-amber.vercel.app";
    const text = buildOutreachSms({
      subject: "Lost dog near you",
      body: "Open the radar: /radar/abc123",
      shelterName: "RescueHub partner shelter",
    });
    expect(text).toContain("https://animal-rescue-app-amber.vercel.app/radar/abc123");
    expect(text).toContain("Approved by RescueHub partner shelter staff");
    expect(text).toContain("Reply STOP");
  });
});
