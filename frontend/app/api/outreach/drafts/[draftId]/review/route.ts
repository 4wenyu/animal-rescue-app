/**
 * POST /api/outreach/drafts/[draftId]/review
 * ============================================
 * Tier 1.7 — the human gate for the autonomous agent. A STAFF/ADMIN reviews a
 * DRAFT and either APPROVES it (→ SENT, i.e. queued for the delivery channel)
 * or SKIPS it (→ SKIPPED). Nothing is ever delivered without this step.
 *
 * Body: { approve: boolean, note?: string }
 * RBAC: STAFF/ADMIN.
 */

import { NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { reviewOutreachDraft } from "@/lib/services/outreachService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ draftId: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
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
      { error: "Forbidden", message: "STAFF/ADMIN role required to review." },
      { status: 403 },
    );
  }

  const { draftId } = await params;

  let approve: boolean;
  let note: string | undefined;
  try {
    const body = (await request.json()) as { approve?: unknown; note?: unknown };
    if (typeof body.approve !== "boolean") {
      return NextResponse.json(
        { error: "Bad Request", message: "approve (boolean) is required." },
        { status: 400 },
      );
    }
    approve = body.approve;
    note = typeof body.note === "string" ? body.note : undefined;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const next = await reviewOutreachDraft(
      draftId,
      session.user.id as string,
      approve,
      note,
    );
    return NextResponse.json({ ok: true, status: next }, { status: 200 });
  } catch (err) {
    console.error("[api/outreach/drafts/[draftId]/review] failed:", err);
    return NextResponse.json(
      {
        error: err instanceof Error && err.message === "Draft not found"
          ? "Not Found"
          : "Conflict",
        message:
          err instanceof Error ? err.message : "Could not review draft.",
      },
      { status: err instanceof Error && err.message === "Draft not found" ? 404 : 409 },
    );
  }
}
