/**
 * Optional shared rate-limit store (N5).
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, counters
 * are global across instances. Otherwise callers use in-memory limits.
 */
export function hasRedisRateLimit(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** Fixed-window counter via Upstash REST. Returns null on transport failure. */
export async function redisFixedWindowHit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSeconds: number } | null> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;

  try {
    const incrRes = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!incrRes.ok) return null;
    const incrJson = (await incrRes.json()) as { result?: number };
    const count = Number(incrJson.result ?? 0);

    if (count === 1) {
      await fetch(
        `${base}/expire/${encodeURIComponent(redisKey)}/${windowSec}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
    }

    if (count > limit) {
      const ttlRes = await fetch(
        `${base}/ttl/${encodeURIComponent(redisKey)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const ttlJson = (await ttlRes.json().catch(() => null)) as {
        result?: number;
      } | null;
      const ttl = Number(ttlJson?.result ?? windowSec);
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, ttl > 0 ? ttl : windowSec),
      };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.warn("[rate-limit] redis unavailable, falling back to memory:", err);
    return null;
  }
}
