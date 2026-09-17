/**
 * POST /api/auth/register
 * =======================
 * Public self-registration route (the signup path for the community-remix
 * pivot). Creates a CITIZEN user with a scrypt-hashed password and a fresh
 * ACTIVE token wallet.
 *
 * Role escalation is intentionally not expressible from the public API:
 *   - Everyone self-registers as CITIZEN.
 *   - STAFF/ADMIN are provisioned only by the seed script (server-side),
 *     gated behind REGISTRATION_ADMIN_KEY, or promoted manually in the DB.
 *
 * Validation is fail-closed and minimal:
 *   - email    : single valid address, ≤ 254 chars, trimmed + lowercased.
 *   - password : UTF-8 → ≤ 72 bytes, ≥ 8 chars, and must contain a letter
 *                and a number (kept deliberately loose so real shelter staff
 *                aren't locked out — do NOT add NIST-discredited complexity
 *                rules).
 *   - displayName : 1–80 chars, trimmed.
 *
 * Returns 409 on duplicate email; never reveals whether another account
 * exists beyond the signup call itself.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { grantPreviewSearchCredit } from "@/lib/services/tokenService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(254)
    .email(),
  password: z.string().min(8).max(72).refine(
    (p) => /[a-zA-Z]/.test(p) && /[0-9]/.test(p),
    { message: "password must contain at least one letter and one number" },
  ),
  displayName: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { userId: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          displayName,
          passwordHash,
          role: "CITIZEN",
          marketingOptIn: false,
        },
      });
      await tx.tokenWallet.create({
        data: {
          userId: created.userId,
          cachedBalance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
          lifetimeExpired: 0,
          status: "ACTIVE",
        },
      });
      return created;
    });

    try {
      await grantPreviewSearchCredit(user.userId);
    } catch (creditErr) {
      console.error(
        "[api/auth/register] Preview search credit failed; account still created:",
        creditErr,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.userId,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    // The findUnique pre-check above can lose a concurrent race; translate the
    // unique-constraint violation into the same 409 instead of a 500.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }
    // Anything else is a server fault: log it, but never surface the error
    // (or a framework stack trace) to an unauthenticated caller.
    console.error("[api/auth/register] Registration failed:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
