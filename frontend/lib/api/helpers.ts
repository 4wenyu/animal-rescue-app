/**
 * Shared API route helpers — uniform auth gating + body parsing.
 * ==============================================================
 * Collapses the per-route boilerplate repeated across app/api/**:
 *
 *   - `requireRole(...roles)` — session + role gate. Returns either the
 *     authenticated user or a ready-to-return 401/403 NextResponse, so every
 *     route answers auth failures with the same house shape:
 *       401 → { error: "Unauthorized", message: "Valid session required." }
 *       403 → { error: "Forbidden",     message: "<ROLE/ROLE> role required." }
 *     Called with no roles it acts as a plain session check (ownership
 *     checks against `user.id` stay in the route).
 *
 *   - `parseJsonBody(request, schema)` — Zod-validated JSON body parsing.
 *     Returns either the parsed data or a ready-to-return 400 NextResponse:
 *       invalid JSON → { error: "Bad Request",      message: "Invalid JSON body." }
 *       schema fail  → { error: "Validation Error", message: "Body failed validation.",
 *                         details: [{ path, message }] }
 *     The `details` entry shape matches the convention already used by
 *     shares, tokens, animals/intake and outreach/opt-in.
 *
 * Response convention: success { ok: true, ... }, failure { error, message?, details? }.
 */

import { NextResponse } from "next/server";
import type { z } from "zod";

/** Minimal session-user DTO every route can rely on. */
export type SessionUser = {
  id: string;
  /** Undefined when the session token carries no role claim. */
  role: string | undefined;
  email: string | null;
  name: string | null;
};

export type RequireRoleResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Authenticate the caller and (optionally) enforce one of `roles`.
 * The NextAuth `auth()` import is dynamic so public routes that only need
 * `parseJsonBody` don't transitively initialize the NextAuth config.
 */
export async function requireRole(
  ...roles: string[]
): Promise<RequireRoleResult> {
  const { auth } = await import("@/app/api/auth/[...nextauth]/auth");
  const session = await auth();

  // The session DTO carries id/role only via the jwt/session callbacks, so
  // read them defensively (same casts the routes used before this helper).
  const rawUser = session?.user as
    | (Record<string, unknown> & { id?: unknown })
    | undefined;
  const id = typeof rawUser?.id === "string" ? rawUser.id : undefined;

  if (!id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Valid session required." },
        { status: 401 },
      ),
    };
  }

  const role = typeof rawUser?.role === "string" ? rawUser.role : undefined;

  if (roles.length > 0 && (role === undefined || !roles.includes(role))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", message: `${roles.join("/")} role required.` },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: {
      id,
      role,
      email: typeof rawUser?.email === "string" ? rawUser.email : null,
      name: typeof rawUser?.name === "string" ? rawUser.name : null,
    },
  };
}

export type ParseJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Parse and Zod-validate a JSON request body. Collapses the identical
 * try/catch + safeParse + error-flatten blocks routes used to hand-roll.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseJsonResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Validation Error",
          message: "Body failed validation.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
