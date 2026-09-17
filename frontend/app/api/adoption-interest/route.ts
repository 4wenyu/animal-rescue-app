/**
 * POST /api/adoption-interest
 * ============================
 * Sprint B — adoption funnel lead capture.
 *
 * Public endpoint (no session required): a visitor on /adopt/[id] submits
 * an "Adopt" / "Foster" application and we persist a lightweight lead row
 * so the shelter can follow up. No tokens, no auth — the funnel must work
 * for a first-time adopter before they have an account.
 *
 * Validation: minimum fullName + valid email + animalId + interestType.
 * Hard-caps message length. A per-IP cooldown (shared sliding-window
 * limiter) prevents form spam.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody } from "@/lib/api/helpers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Per-IP cooldown: max 5 submissions per 10 minutes (shared limiter). */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

/** Trim + hard-cap a free-text field; missing/non-string coerces to "". */
const text = (max: number) =>
  z.string().trim().transform((s) => s.slice(0, max)).catch("");

const AdoptionInterestSchema = z.object({
  fullName: text(120).pipe(
    z.string().min(2, "fullName must be at least 2 characters"),
  ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .catch("")
    .pipe(
      z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be a valid address"),
    ),
  animalId: text(64).pipe(z.string().min(1, "animalId is required")),
  animalName: text(120),
  interestType: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .catch("")
    .pipe(
      z.enum(["ADOPT", "FOSTER"], {
        message: "interestType must be ADOPT or FOSTER",
      }),
    ),
  phone: text(40),
  message: text(2000),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { ok: withinLimit, retryAfterSeconds } = checkRateLimit(
    `adoption-interest:${ip}`,
    RATE_MAX,
    RATE_WINDOW_MS,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await parseJsonBody(request, AdoptionInterestSchema);
  if (!body.ok) return body.response;
  const { fullName, email, animalId, animalName, interestType, phone, message } =
    body.data;

  try {
    const lead = await prisma.adoptionInterest.create({
      data: {
        animalId,
        animalName,
        interestType,
        fullName,
        email,
        phone: phone || null,
        message: message || null,
        status: "NEW",
      },
      select: {
        interestId: true,
        animalId: true,
        animalName: true,
        interestType: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch (err) {
    console.error("[api/adoption-interest] create failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not save your application." },
      { status: 500 },
    );
  }
}
