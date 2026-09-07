/**
 * POST /api/shares
 * =================
 * Create a ViralShareVerification row when a user signs into the share
 * flow (e.g. clicks "Share this animal on Facebook"). Returns:
 *   - shareId       : ViralShareVerification UUID
 *   - trackingUrl   : canonical share URL — `/p/<shareId>` — the user
 *                      pastes into WhatsApp, FB group, etc.
 *   - platformShareHint : platform-specific one-click intent URLs where
 *                          they exist (FB, Nextdoor, WA, Reddit).
 *
 * Request body:
 *   {
 *     platform: "FACEBOOK_GROUP" | "NEXTDOOR" | ... (12 platforms),
 *     platformPostId: string (unique nonce ≥ 12 chars, ≤ 128),
 *     contentUrl?: string,
 *     evidenceSnapshot?: record,
 *     status?: "PENDING" | "VERIFIED" | ...,
 *     relatedAnimalId?: string     // stored inside evidenceSnapshot
 *                                   // so the landing page can find it.
 *   }
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ViralShareVerificationCreateSchema } from "@/lib/schemas/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN_FALLBACK = "http://localhost:3000";

/** Read an authenticated request and write the share record. */
export async function POST(request: Request) {
  // ── Auth ────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const userId = session.user.id as string;

  // ── Body ───────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // The optional relatedAnimalId lives outside the canonical schema —
  // pull it out of the raw body before validation, then re-attach it
  // into evidenceSnapshot once we know it's a valid UUID.
  const rawBody = body as Record<string, unknown>;
  const relatedAnimalId =
    typeof rawBody.relatedAnimalId === "string"
      ? rawBody.relatedAnimalId
      : null;
  // Sprint C — search-scoped shares ("Share my search" on the radar).
  // The share carries which LostPetSearch it belongs to so the radar can
  // show honest free-search progress (X verified / 10) for that search.
  const relatedSearchId =
    typeof rawBody.relatedSearchId === "string"
      ? rawBody.relatedSearchId
      : null;

  let parsed;
  try {
    parsed = ViralShareVerificationCreateSchema.parse({
      ...rawBody,
      userId, // server-side override; never trust body
      // Strip the optional relatedAnimalId field before schema validation
      // (it's not on the canonical schema) but keep it in evidenceSnapshot.
      relatedAnimalId: undefined,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: err.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Bad Request", message: "Could not parse request body." },
      { status: 400 },
    );
  }

  // ── Insert ViralShareVerification row (PENDING until reviewed) ──
  try {
    const evidenceSnapshot = {
      ...(parsed.evidenceSnapshot ?? {}),
      ...(relatedAnimalId ? { relatedAnimalId } : {}),
      ...(relatedSearchId ? { relatedSearchId } : {}),
    };

    const share = await prisma.viralShareVerification.create({
      data: {
        userId,
        platform: parsed.platform,
        contentUrl: parsed.contentUrl,
        platformPostId: parsed.platformPostId,
        evidenceSnapshot: evidenceSnapshot as object,
        // Tier 0.3: ALWAYS start PENDING. A client-supplied `status` (the
        // schema allows VERIFIED/REJECTED/EXPIRED) is NEVER trusted here —
        // self-verification was a review finding. VERIFIED can only be set
        // via the ADMIN review endpoint (PATCH /api/shares/[shareId]).
        status: "PENDING",
      },
    });

    // ── Build the canonical tracking URL: /p/<shareId> ─────────
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? ORIGIN_FALLBACK;
    const trackingUrl = `${origin.replace(/\/$/, "")}/p/${share.shareId}`;

    const shareHint = share.platform === "FACEBOOK_GROUP"
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`
      : share.platform === "WHATSAPP_GROUP"
        ? `https://wa.me/?text=${encodeURIComponent(trackingUrl)}`
        : share.platform === "SUBREDDIT"
          ? `https://www.reddit.com/submit?url=${encodeURIComponent(trackingUrl)}&title=${encodeURIComponent("Please help this animal")}`
          : share.platform === "NEXTDOOR"
            ? `https://nextdoor.com/share?url=${encodeURIComponent(trackingUrl)}`
            : share.platform === "INSTAGRAM_STORY"
              ? null
              : share.platform === "GENERIC_LINK"
                ? null
                : trackingUrl;

    return NextResponse.json(
      {
        ok: true,
        shareId: share.shareId,
        platform: share.platform,
        status: share.status,
        // ← canonical URL the user pastes into WhatsApp / Reddit / FB
        trackingUrl,
        // ← platform-specific helper URLs for one-click share buttons
        platformShareHint: shareHint,
        // ← animal context the landing page will reuse (for the profile stub)
        relatedAnimalId,
        // Echo the observedAt: undefined on initial create; the landing
        // page will set this on first hit via a future resolver endpoint.
        observedAt: share.observedAt?.toISOString() ?? null,
        createdAt: share.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/shares] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not create share." },
      { status: 500 },
    );
  }
}

/**
 * GET /api/shares?searchId=<uuid>
 * ===============================
 * Sprint C — honest free-search progress. Returns how many of the signed-in
 * user's shares are linked to a specific LostPetSearch (via
 * evidenceSnapshot.relatedSearchId), split PENDING vs VERIFIED, so the radar
 * widget can show "X of 10 verified shares → free search" truthfully.
 *
 * Auth: session required (the radar is a signed-in owner surface).
 * No side effects — this is a pure read.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const userId = session.user.id as string;

  const url = new URL(request.url);
  const searchId = url.searchParams.get("searchId");
  if (!searchId) {
    return NextResponse.json(
      { error: "Bad Request", message: "searchId query param is required." },
      { status: 400 },
    );
  }

  try {
    const shares = await prisma.viralShareVerification.findMany({
      where: {
        userId,
        evidenceSnapshot: {
          path: ["relatedSearchId"],
          equals: searchId,
        },
      },
      select: {
        shareId: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const verified = shares.filter((s) => s.status === "VERIFIED").length;
    const pending = shares.filter((s) => s.status === "PENDING").length;

    return NextResponse.json({
      ok: true,
      searchId,
      total: shares.length,
      verified,
      pending,
      // Milestone for the widget (10 verified shares → search is free).
      milestone: 10,
    });
  } catch (err) {
    console.error("[api/shares] GET failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not read shares." },
      { status: 500 },
    );
  }
}