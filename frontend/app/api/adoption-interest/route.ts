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
 * Hard-caps message length. A simple per-IP cooldown prevents form spam.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTEREST_TYPES = new Set(["ADOPT", "FOSTER"]);

/** Per-IP cooldown: max 5 submissions per 10 minutes (in-memory, dev-grade). */
const _rate: Map<string, number[]> = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (_rate.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  _rate.set(ip, hits);
  return false;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json(
        { error: "Bad Request", message: "Body must be a JSON object." },
        { status: 400 },
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const errors: string[] = [];

  const fullName =
    typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const animalId = typeof body.animalId === "string" ? body.animalId.trim().slice(0, 64) : "";
  const animalName =
    typeof body.animalName === "string" ? body.animalName.trim().slice(0, 120) : "";
  const interestType = typeof body.interestType === "string" ? body.interestType.trim().toUpperCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";

  if (fullName.length < 2) errors.push("fullName must be at least 2 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email must be a valid address");
  if (!animalId) errors.push("animalId is required");
  if (!INTEREST_TYPES.has(interestType)) errors.push("interestType must be ADOPT or FOSTER");

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation Error", message: "Body failed validation.", details: errors },
      { status: 400 },
    );
  }

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
