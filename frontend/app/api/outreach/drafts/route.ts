/**
 * GET /api/outreach/drafts
 * =========================
 * Tier 1.7 — staff/admin queue of agent-generated outreach drafts awaiting
 * human review. Pure read; the human gate lives here.
 *
 * RBAC: STAFF/ADMIN. Returns DRAFT rows first (the pending queue), then a
 * short history of SENT/SKIPPED.
 */

import { NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  if (role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", message: "STAFF/ADMIN role required." },
      { status: 403 },
    );
  }

  try {
    const drafts = await prisma.outreachDraft.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        draftId: true,
        status: true,
        helpAsk: true,
        subject: true,
        body: true,
        sourceNote: true,
        animalId: true,
        createdAt: true,
        reviewedAt: true,
        sentAt: true,
        profile: {
          select: {
            regionLabel: true,
            user: { select: { displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, drafts }, { status: 200 });
  } catch (err) {
    console.error("[api/outreach/drafts] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not load drafts." },
      { status: 500 },
    );
  }
}
