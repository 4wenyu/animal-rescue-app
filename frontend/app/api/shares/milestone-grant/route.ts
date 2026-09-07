/**
 * POST /api/shares/milestone-grant
 * =================================
 * Tier 1.6 — honors the Idea's economy promise: "share with 10 groups →
 * search is free". Called by the radar widget when its live progress shows
 * 10+ VERIFIED shares; also invoked automatically from the admin review
 * endpoint (PATCH /api/shares/[shareId]) the moment a share flips VERIFIED.
 *
 * Auth: session required (only the search owner can resolve their grant).
 * Idempotent: the underlying ledger uses idempotencyKey
 * `share-milestone:${searchId}`, so repeated calls never double-mint.
 */

import { NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { grantFreeSearchMilestone } from "@/lib/services/tokenService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const userId = session.user.id as string;

  let searchId: string;
  try {
    const body = (await request.json()) as { searchId?: unknown };
    if (typeof body.searchId !== "string" || body.searchId.length === 0) {
      return NextResponse.json(
        { error: "Bad Request", message: "searchId (string) is required." },
        { status: 400 },
      );
    }
    searchId = body.searchId;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // The grant goes to the search owner. Verify the caller owns this search.
  try {
    const search = await prisma.lostPetSearch.findUnique({
      where: { searchId },
      select: { searchId: true, userId: true },
    });
    if (!search) {
      return NextResponse.json(
        { error: "Not Found", message: "No search with that searchId." },
        { status: 404 },
      );
    }
    if (search.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden", message: "You can only resolve grants for your own searches." },
        { status: 403 },
      );
    }

    const result = await grantFreeSearchMilestone(searchId);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    console.error("[api/shares/milestone-grant] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not resolve milestone grant." },
      { status: 500 },
    );
  }
}
