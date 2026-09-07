/**
 * RescueHub — Password Hashing
 * ============================
 * Credential hashing via Node's built-in `crypto.scrypt`. We deliberately
 * avoid bcrypt/argon2 dependencies: scrypt is memory-hard, shipped with the
 * platform, and adequate for this application's threat model once paired
 * with a per-user random salt.
 *
 * Storage format (single TEXT column, self-describing):
 *   scrypt$N$r$p$<salt_b64url>$<digest_b64url>
 *
 * Verify uses `timingSafeEqual` and a fixed compare so a missing/malformed
 * hash can't be used as a timing oracle.
 */

import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/** Wrapper around the callback-style `crypto.scrypt` (typed as a Promise). */
function derive(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

/** Cost parameters (RFC 7914). 2^15 × 8 × 1 ≈ 32 MiB — OWASP-recommended floor. */
const N = 32768;
const r = 8;
const p = 1;
const KEYLEN = 64;
const MAX_PASSWORD_BYTES = 1024; // reject oversized input before hashing

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer | null {
  try {
    return Buffer.from(s, "base64url");
  } catch {
    return null;
  }
}

/** Hash a plaintext password. Returns the self-describing storage string. */
export async function hashPassword(plain: string): Promise<string> {
  if (Buffer.byteLength(plain, "utf8") > MAX_PASSWORD_BYTES) {
    throw new Error("password too long");
  }
  const salt = randomBytes(16);
  const digest = await derive(plain, salt, KEYLEN, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${N}$${r}$${p}$${b64url(salt)}$${b64url(digest)}`;
}

/**
 * Verify a plaintext password against a stored hash string.
 * Returns false on any malformed or missing input (do not throw on compare).
 */
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  if (Buffer.byteLength(plain, "utf8") > MAX_PASSWORD_BYTES) return false;

  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]);
  const rr = Number(parts[2]);
  const pp = Number(parts[3]);
  const salt = fromB64url(parts[4]);
  const expected = fromB64url(parts[5]);

  if (!salt || !expected || !Number.isInteger(n) || !Number.isInteger(rr) || !Number.isInteger(pp)) {
    return false;
  }
  if (n <= 1 || rr < 1 || pp < 1 || expected.length === 0) return false;

  let actual: Buffer;
  try {
    actual = await derive(plain, salt, expected.length, {
      N: n,
      r: rr,
      p: pp,
      maxmem: 128 * 1024 * 1024,
    });
  } catch {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
