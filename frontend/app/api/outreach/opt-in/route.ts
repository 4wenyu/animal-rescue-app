/**
 * POST /api/outreach/opt-in
 * =========================
 * Tier 1.7 — the citizen's explicit "I can help" opt-in for the autonomous
 * outreach agent. Creates (or updates) an OutreachProfile with their chosen
 * help areas + region, and returns their one-click unsubscribe token.
 *
 * Auth: session required — we must attach the profile to a real account so
 * unsubscribe and history are traceable.
 *
 * Honest framing: this is the consent gate for the Idea's autonomous agent.
 * Without this, the agent is never allowed to contact anyone.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HELP_AREAS = ["DONATE", "FOSTER", "ADOPT", "VOLUNTEER", "SHARE", "TRANSPORT"] as const;

const OptInSchema = z.object({
  helpAreas: z
    .array(z.enum(HELP_AREAS))
    .min(1, "Pick at least one way you can help.")
    .max(6),
  regionLabel: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const userId = session.user.id as string;

  let parsed: z.infer<typeof OptInSchema>;
  try {
    parsed = OptInSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: err.issues.map((e) => ({ path: e.path.join("."), message: e.message })),
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.outreachProfile.findUnique({ where: { userId } });
    const profile = existing
      ? await prisma.outreachProfile.update({
          where: { userId },
          data: {
            status: "ACTIVE",
            helpAreas: parsed.helpAreas as never,
            regionLabel: parsed.regionLabel ?? existing.regionLabel,
            unsubscribedAt: null,
          },
        })
      : await prisma.outreachProfile.create({
          data: {
            userId,
            status: "ACTIVE",
            helpAreas: parsed.helpAreas as never,
            regionLabel: parsed.regionLabel ?? null,
            consentGiven: new Date(),
          },
        });

    return NextResponse.json(
      {
        ok: true,
        profile: {
          profileId: profile.profileId,
          status: profile.status,
          helpAreas: profile.helpAreas,
          regionLabel: profile.regionLabel,
          // One-click unsubscribe link is scoped to the owner.
          unsubscribeToken: profile.unsubscribeToken,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/outreach/opt-in] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not save your outreach preference." },
      { status: 500 },
    );
  }
}
