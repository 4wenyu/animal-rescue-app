/**
 * Shared in-memory sliding-window rate limiter.
 * ==============================================
 * Small, dependency-free limiter for gating expensive or public API routes
 * (AI/cost endpoints, notification fan-out, public forms). Keyed by caller
 * identity — typically IP, optionally `ip + ":" + sessionId` for tighter
 * per-user limits when a session exists.
 *
 * PRODUCTION NOTE: this state lives in the Node process. A multi-instance
 * or multi-region deployment MUST back this with Redis (or a DB table with
 * TTL cleanup) or limits will be enforced per-instance instead of globally.
 *
 * Unlike hand-rolled per-route maps (see app/api/adoption-interest/route.ts),
 * stale buckets are pruned so the map cannot grow without bound — the leak
 * pattern flagged in api/adoption-interest.
 */

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

  // Throttled sweep: prune stale keys at most once a minute, or immediately
  // when the map is near its hard cap (prevents unbounded memory growth).
  if (now - lastSweepAt >= SWEEP_INTERVAL_MS || buckets.size >= MAX_TRACKED_KEYS) {
    sweep(now, windowMs);
  }

  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Best-effort client IP from proxy headers (matches the convention already
 * used in app/api/adoption-interest/route.ts). Falls back to "unknown" so
 * callers behind no proxy still get a shared bucket instead of a crash.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
