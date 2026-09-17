/**
 * POST /api/outreach/generate
 * ============================
 * Tier 1.7 — runs the autonomous agent's draft-generation stage. It scans
 * ACTIVE opt-in profiles, matches nearby at-risk animals, and writes honest
 * DRAFT outreach rows. Drafts are never delivered without STAFF/ADMIN review.
 *
 * RBAC: STAFF/ADMIN (the agent's output is the shelter's responsibility).
 * Idempotent-ish: profiles that already have an open DRAFT are skipped.
 */

import { NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import {
  generateOutreachDrafts,
  previewOutreachGeneration,
} from "@/lib/services/outreachService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireStaff() {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;
  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Valid session required." },
        { status: 401 },
      ),
    };
  }
  if (role !== "STAFF" && role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Forbidden", message: "STAFF/ADMIN role required to run the agent." },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const };
}

/** Plan-only: what the agent would draft, without writing rows. */
export async function GET() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;
  try {
    const preview = await previewOutreachGeneration(5);
    return NextResponse.json({ ok: true, preview }, { status: 200 });
  } catch (err) {
    console.error("[api/outreach/generate] preview failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not preview the agent run." },
      { status: 500 },
    );
  }
}

export async function POST() {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  try {
    const created = await generateOutreachDrafts(5);
    return NextResponse.json(
      {
        ok: true,
        created,
        note:
          "Draft outreach generated. Nothing is delivered until a staff member approves it.",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[api/outreach/generate] failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Agent run failed." },
      { status: 500 },
    );
  }
}
