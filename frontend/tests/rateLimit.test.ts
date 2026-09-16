/**
 * Sliding-window rate limiter. This is the only thing standing between the
 * public AI endpoints and an unbounded Gemini bill, so the window edges and
 * the key isolation both matter.
 */
import { describe, expect, it, afterEach, vi } from "vitest";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const WINDOW = 60_000;

/** Unique key per assertion — limiter state is module-level and shared. */
let keySeq = 0;
function freshKey(): string {
  return `test-key-${process.pid}-${keySeq++}`;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows exactly `limit` hits then blocks", () => {
    const key = freshKey();

    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, WINDOW).ok, `hit ${i + 1}`).toBe(true);
    }
    expect(checkRateLimit(key, 3, WINDOW).ok).toBe(false);
  });

  it("reports a positive Retry-After when blocked", () => {
    const key = freshKey();
    checkRateLimit(key, 1, WINDOW);
    const blocked = checkRateLimit(key, 1, WINDOW);

    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("keeps separate callers in separate buckets", () => {
    const a = freshKey();
    const b = freshKey();

    expect(checkRateLimit(a, 1, WINDOW).ok).toBe(true);
    expect(checkRateLimit(a, 1, WINDOW).ok).toBe(false);
    // b must be unaffected by a's exhaustion.
    expect(checkRateLimit(b, 1, WINDOW).ok).toBe(true);
  });

  it("does not release the bucket early, and releases it once the window passes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const key = freshKey();

    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(true);
    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(true);
    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(false);

    vi.advanceTimersByTime(WINDOW - 1);
    expect(checkRateLimit(key, 2, WINDOW).ok, "still inside the window").toBe(false);

    vi.advanceTimersByTime(2);
    expect(checkRateLimit(key, 2, WINDOW).ok, "window has rolled over").toBe(true);
  });

  it("slides rather than resetting in fixed blocks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const key = freshKey();

    checkRateLimit(key, 2, WINDOW);
    vi.advanceTimersByTime(30_000);
    checkRateLimit(key, 2, WINDOW);
    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(false);

    // Only the first hit has aged out, so exactly one slot frees up.
    vi.advanceTimersByTime(30_001);
    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(true);
    expect(checkRateLimit(key, 2, WINDOW).ok).toBe(false);
  });
});

describe("getClientIp", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const request = new Request("https://example.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" },
    });

    expect(getClientIp(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(
      getClientIp(
        new Request("https://example.test", { headers: { "x-real-ip": "198.51.100.4" } }),
      ),
    ).toBe("198.51.100.4");

    expect(getClientIp(new Request("https://example.test"))).toBe("unknown");
  });
});
