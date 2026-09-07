/**
 * PATCH /api/shares/[shareId]
 * =============================
 * Admin/STAFF review endpoint — the ONLY place a share may leave PENDING.
 *
 * Tier 0.3 hardening: client self-verification was a review finding
 * (POST /api/shares used to accept a client-supplied `status`). Now POST
 * always creates PENDING; flipping to VERIFIED/REJECTED/EXPIRED requires a
 * trusted staff/ADMIN session calling this endpoint. This is also where the
 * share-verification loop (Tier 1) hooks in when evidence is reviewed.
 *
 * Body: { status: "VERIFIED" | "REJECTED" | "EXPIRED", reviewerNote?: string }
 *
 * RBAC: STAFF or ADMIN.
 * No token mint happens here — the verifier/grant logic (T1-6) observes the
 * VERIFIED status and grants the 10-share free-search reward.
 */

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { grantFreeSearchMilestone } from "@/lib/services/tokenService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ReviewSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED", "EXPIRED"]),
  reviewerNote: z.string().max(255).optional(),
});

interface RouteContext {
  params: Promise<{ shareId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  // ── 1. Authenticate + RBAC ─────────────────────────────────────
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
      { error: "Forbidden", message: "STAFF/ADMIN role required to review shares." },
      { status: 403 },
    );
  }

  const { shareId } = await params;

  // ── 2. Validate body ──────────────────────────────────────────
  let data: z.infer<typeof ReviewSchema>;
  try {
    data = ReviewSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof ZodError) {
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

  // ── 3. Load + update the share ────────────────────────────────
  try {
    const existing = await prisma.viralShareVerification.findUnique({
      where: { shareId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Not Found", message: "No share with that shareId." },
        { status: 404 },
      );
    }

    // A settled share (VERIFIED/REJECTED/EXPIRED) can't be re-flipped to
    // PENDING via this endpoint — the schema only accepts settling statuses,
    // so this is structurally guaranteed.
    const updated = await prisma.viralShareVerification.update({
      where: { shareId },
      data: {
        status: data.status,
        reviewerNote: data.reviewerNote ?? existing.reviewerNote,
        reviewedAt: new Date(),
      },
      select: {
        shareId: true,
        status: true,
        reviewerNote: true,
        reviewedAt: true,
      },
    });

    // Tier 1.6: when a share flips VERIFIED, immediately evaluate whether
    // the linked lost-pet search has hit the 10-verified-share milestone and
    // grant the free search. grantFreeSearchMilestone is idempotent, so
    // re-reviewing the same share can never double-mint.
    let milestone: {
      granted: boolean;
      alreadyGranted: boolean;
      verifiedCount: number;
      balanceAfter?: number;
    } | null = null;
    if (updated.status === "VERIFIED") {
      const snapshot = existing.evidenceSnapshot as
        | { relatedSearchId?: unknown }
        | null
        | undefined;
      const relatedSearchId = snapshot?.relatedSearchId;
      if (typeof relatedSearchId === "string" && relatedSearchId.length > 0) {
        milestone = await grantFreeSearchMilestone(relatedSearchId);
      }
    }

    return NextResponse.json(
      { ok: true, share: updated, milestoneGrant: milestone },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/shares/[shareId]] review failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not update share." },
      { status: 500 },
    );
  }
}
