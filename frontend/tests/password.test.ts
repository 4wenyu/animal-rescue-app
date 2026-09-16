/**
 * Credential hashing. `verifyPassword` must reject every malformed input
 * shape without throwing, because a thrown error in the NextAuth authorize
 * callback surfaces as a 500 rather than a failed login.
 */
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("hashPassword", () => {
  it("produces a self-describing scrypt string", async () => {
    const stored = await hashPassword("correct horse battery staple");
    const parts = stored.split("$");

    expect(parts).toHaveLength(6);
    expect(parts[0]).toBe("scrypt");
    expect(Number(parts[1])).toBe(32768);
  });

  it("salts each hash so identical passwords never collide", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);

    expect(a).not.toBe(b);
  });

  it("rejects an oversized password instead of hashing it", async () => {
    await expect(hashPassword("x".repeat(1025))).rejects.toThrow(/too long/);
  });
});

describe("verifyPassword", () => {
  it("accepts the original password", async () => {
    const stored = await hashPassword("s3cret-passphrase");

    await expect(verifyPassword("s3cret-passphrase", stored)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("s3cret-passphrase");

    await expect(verifyPassword("s3cret-passphras", stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("returns false for absent stored hashes", async () => {
    await expect(verifyPassword("anything", null)).resolves.toBe(false);
    await expect(verifyPassword("anything", undefined)).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });

  it.each([
    ["wrong field count", "scrypt$32768$8$1$c2FsdA"],
    ["wrong algorithm tag", "bcrypt$32768$8$1$c2FsdA$ZGlnZXN0"],
    ["non-numeric cost", "scrypt$abc$8$1$c2FsdA$ZGlnZXN0"],
    ["N below minimum", "scrypt$1$8$1$c2FsdA$ZGlnZXN0"],
    ["empty digest", "scrypt$32768$8$1$c2FsdA$"],
    ["not a hash at all", "plaintext-password"],
  ])("returns false without throwing for %s", async (_label, stored) => {
    await expect(verifyPassword("anything", stored)).resolves.toBe(false);
  });

  it("does not accept an oversized candidate password", async () => {
    const stored = await hashPassword("short");

    await expect(verifyPassword("x".repeat(1025), stored)).resolves.toBe(false);
  });
});
