/**
 * POST /api/outreach/drafts/[draftId]/deliver
 * ============================================
 * Sends an APPROVED draft now (or after the 30s hold via flush).
 * RBAC: STAFF/ADMIN.
 */

import { NextResponse } from "next/server";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { deliverApprovedDraft } from "@/lib/services/outreachDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ draftId: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
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

  const { draftId } = await params;
  const outcome = await deliverApprovedDraft(draftId, session.user.id as string);
  if (outcome.kind === "not-found") {
    return NextResponse.json(
      { error: "Not Found", message: "Draft not found." },
      { status: 404 },
    );
  }
  if (outcome.kind === "already-processed") {
    return NextResponse.json(
      { error: "Conflict", message: "Draft is no longer waiting to send." },
      { status: 409 },
    );
  }
  return NextResponse.json({ ok: true, status: "SENT", outcome }, { status: 200 });
}
