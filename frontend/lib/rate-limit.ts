/**
 * Shared sliding-window rate limiter.
 * ==============================================
 * Default: in-memory (single Node process).
 * N5: when Upstash REST env is set, `checkRateLimitAsync` uses Redis so
 * multi-instance deploys share one counter. Sync `checkRateLimit` stays for
 * tests and memory-only paths.
 */

import {
  hasRedisRateLimit,
  redisFixedWindowHit,
} from "@/lib/rate-limit-redis";

/** One bucket = hit timestamps inside the current window. */
const buckets = new Map<string, number[]>();

/** Hard cap on tracked keys; a full sweep runs before exceeding it. */
const MAX_TRACKED_KEYS = 10_000;

/** Minimum interval between background sweeps (ms). */
const SWEEP_INTERVAL_MS = 60 * 1000;

/** Largest window seen so far — buckets older than this are prunable. */
let widestWindowMs = 0;

let lastSweepAt = 0;

function sweep(now: number, windowMs: number): void {
  if (windowMs > widestWindowMs) widestWindowMs = windowMs;
  const cutoff = now - widestWindowMs;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => t > cutoff);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
  lastSweepAt = now;
}

export type RateLimitResult = {
  /** True when the caller is still under the limit (hit recorded). */
  ok: boolean;
  /** Seconds until the oldest in-window hit expires. */
  retryAfterSeconds: number;
};

/**
 * Record a hit for `key` and report whether `limit` hits within `windowMs`
 * is exceeded. Call once per request, before doing expensive work.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();

  if (
    now - lastSweepAt >= SWEEP_INTERVAL_MS ||
    buckets.size >= MAX_TRACKED_KEYS
  ) {
    sweep(now, windowMs);
  }

  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      ),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/** Prefer Redis when configured; otherwise identical to `checkRateLimit`. */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (hasRedisRateLimit()) {
    const remote = await redisFixedWindowHit(key, limit, windowMs);
    if (remote) return remote;
  }
  return checkRateLimit(key, limit, windowMs);
}

export function rateLimitBackend(): "redis" | "memory" {
  return hasRedisRateLimit() ? "redis" : "memory";
}

/**
 * Best-effort client IP from proxy headers. Falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
