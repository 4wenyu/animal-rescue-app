/**
 * POST /api/outreach/unsubscribe
 * ===============================
 * Tier 1.7 — one-click unsubscribe from the autonomous outreach agent.
 *
 * Auth: NONE (public). The caller presents their profile's unsubscribeToken,
 * which is only ever shown to the profile owner (returned on opt-in). This
 * mirrors real-world one-click unsubscribe links in outreach emails.
 *
 * Honest: flipping to UNSUBSCRIBED is immediate and permanent until the user
 * opts back in via /api/outreach/opt-in.
 */

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let token: string;
  try {
    const body = (await request.json()) as { token?: unknown };
    if (typeof body.token !== "string" || body.token.length < 8) {
      return NextResponse.json(
        { error: "Bad Request", message: "token (string) is required." },
        { status: 400 },
      );
    }
    token = body.token;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const profile = await prisma.outreachProfile.findUnique({
      where: { unsubscribeToken: token },
    });
    if (!profile) {
      return NextResponse.json(
        { error: "Not Found", message: "Unknown unsubscribe token." },
        { status: 404 },
      );
    }

    await prisma.outreachProfile.update({
      where: { profileId: profile.profileId },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.json(
      { ok: true, status: "UNSUBSCRIBED", message: "You are unsubscribed from outreach." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/outreach/unsubscribe] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not unsubscribe." },
      { status: 500 },
    );
  }
}
