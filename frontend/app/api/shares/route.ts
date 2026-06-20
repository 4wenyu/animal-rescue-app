/**
 * POST /api/shares
 * =================
 * Create a ViralShareVerification row when a user signs into the share
 * flow (e.g. clicks "Share this animal on Facebook"). Returns:
 *   - shareId : the verification UUID
 *   - trackingUrl : the platform-agnostic UTM-tagged URL the user can
 *                    send to social media, OR
 *   - shareBadgeUrl : the platform-specific deep-link helper
 *
 * STUB NOTES
 * ----------
 * This stub:
 *   - Builds a per-animal tracking URL of the form
 *         /r/<animalId>?via=share&utm=<shareId>
 *   - Persists a ViralShareVerification in PENDING status
 *   - Does NOT yet build platform-specific deep-links (FB share dialog,
 *     Nextdoor, WhatsApp) — that's the next sprint's task
 *   - Does NOT award tokens; share resolution is a Phase 2 workstream.
 *
 * Once platform helpers land, this route will dispatch to them and
 * return their per-platform share buttons.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ViralShareVerificationCreateSchema } from "@/lib/schemas/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGIN_FALLBACK = "http://localhost:3000";

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

  let parsed;
  try {
    parsed = ViralShareVerificationCreateSchema.parse({
      ...body,
      userId, // server-side override; never trust body
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

  // ── Look up the animal so we can build a meaningful tracking URL ──
  // For now: accept any animalId and embed it in the URL. If the animal
  // row exists in our DB it's a "verified" share; if not, the URL is
  // still valid for the test path. A guard here becomes important when
  // we wire platform-specific deep-links so we don't share `/r/<bogus>`.
  const animalId = (body as { animalId?: string }).animalId ?? null;

  // ── Insert ViralShareVerification row (PENDING until reviewed) ──
  try {
    const share = await prisma.viralShareVerification.create({
      data: {
        userId,
        platform: parsed.platform,
        contentUrl: parsed.contentUrl,
        platformPostId: parsed.platformPostId,
        evidenceSnapshot: (parsed.evidenceSnapshot as unknown as object) || undefined,
        status: parsed.status,
        // FK to related Animal is intentionally left out: the schema
        // doesn't have a direct ANIMAL column on ViralShareVerification.
        // Future: we add a follow-up migration to add `relatedAnimalId`.
      },
    });

    // ── Build the canonical tracking URL ────────────────────
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL ?? ORIGIN_FALLBACK;
    const trackingUrl = animalId
      ? `${origin.replace(/\/$/, "")}/r/${animalId}?via=share&utm=${share.shareId}`
      : `${origin.replace(/\/$/, "")}/r/_?via=share&utm=${share.shareId}`;

    return NextResponse.json(
      {
        ok: true,
        shareId: share.shareId,
        platform: share.platform,
        status: share.status,
        trackingUrl,
        resolvedAction: null,
        createdAt: share.createdAt.toISOString(),
        // Stub-only fields:
        platformShareHint:
          share.platform === "FACEBOOK_GROUP"
            ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`
            : share.platform === "WHATSAPP_GROUP"
              ? `https://wa.me/?text=${encodeURIComponent(trackingUrl)}`
              : share.platform === "SUBREDDIT"
                ? `https://www.reddit.com/submit?url=${encodeURIComponent(trackingUrl)}&title=${encodeURIComponent("Please help this animal")}`
                : share.platform === "NEXTDOOR"
                  ? `https://nextdoor.com/share?url=${encodeURIComponent(trackingUrl)}`
                  : share.platform === "INSTAGRAM_STORY"
                    ? null
                    : trackingUrl,
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