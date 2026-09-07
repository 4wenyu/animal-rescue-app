/**
 * PATCH /api/searches/[searchId]
 * ==============================
 * Lost Pet Search lifecycle transition (Epic 3, Sprint A — status timeline).
 *
 * Terminal transitions supported:
 *   SEARCHING → FOUND     (pet recovered)
 *   SEARCHING → CANCELLED (give up / false alarm)
 *
 * Guardrails:
 *   - Session required.
 *   - Ownership boundary: only the search owner may transition, UNLESS the
 *     session role is ADMIN or STAFF (staff may close on the owner's behalf,
 *     e.g. when the shelter confirms a recovery by intake match).
 *   - Transitions are terminal — once FOUND/CANCELLED the row is immutable.
 *   - closedAt is stamped server-side (never trusted from the body).
 *   - Optional `notes` is appended ("— closed: …"), never replacing capture notes.
 *
 * Auth: reuse the session DTO shape from /api/searches (user.id + role).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  status: z.enum(["FOUND", "CANCELLED"]),
  notes: z.string().trim().max(280).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ searchId: string }> },
) {
  const { searchId } = await context.params;

  /* ── 1. Authenticate ─────────────────────────────────────────────── */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const authenticatedUserId = session.user.id as string;
  const role = (session.user as unknown as Record<string, unknown>).role as
    | string
    | undefined;

  /* ── 2. Validate body ────────────────────────────────────────────── */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { status, notes } = parsed.data;

  /* ── 3. Load row ─────────────────────────────────────────────────── */
  const search = await prisma.lostPetSearch.findUnique({ where: { searchId } });
  if (!search) {
    return NextResponse.json(
      { error: "Not Found", message: "No LostPetSearch with that id." },
      { status: 404 },
    );
  }

  /* ── 4. Authorization (owner or staff/admin) ─────────────────────── */
  const isOwner = search.userId === authenticatedUserId;
  const isStaff = role === "ADMIN" || role === "STAFF";
  if (!isOwner && !isStaff) {
    return NextResponse.json(
      { error: "Forbidden", message: "Search belongs to another user." },
      { status: 403 },
    );
  }

  /* ── 5. Terminal-transition only ─────────────────────────────────── */
  if (search.status !== "SEARCHING") {
    return NextResponse.json(
      {
        error: "Conflict",
        message: `Search is already ${search.status} and cannot be transitioned.`,
      },
      { status: 409 },
    );
  }

  /* ── 6. Persist ──────────────────────────────────────────────────── */
  const updatedNotes =
    notes && notes.length > 0
      ? `${search.notes ?? ""}${search.notes ? "\n" : ""}— closed: ${notes}`.trim()
      : search.notes;

  const updated = await prisma.lostPetSearch.update({
    where: { searchId },
    data: {
      status,
      closedAt: new Date(),
      notes: updatedNotes,
    },
    select: {
      searchId: true,
      userId: true,
      species: true,
      breed: true,
      colorMarkings: true,
      collarId: true,
      lastSeen: true,
      status: true,
      debitTxnId: true,
      activatedAt: true,
      closedAt: true,
      notes: true,
    },
  });

  return NextResponse.json({ ok: true, search: updated }, { status: 200 });
}
