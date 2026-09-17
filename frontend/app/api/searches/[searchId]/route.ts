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
 *   - The transition itself is conditional (updateMany on the pre-transition
 *     status), so two concurrent PATCHes cannot both append notes — the loser
 *     of the race gets a 409 instead of a double transition.
 *
 * Auth: shared requireRole() helper (session user.id + role).
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { parseJsonBody, requireRole } from "@/lib/api/helpers";
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
  const authz = await requireRole();
  if (!authz.ok) return authz.response;
  const authenticatedUserId = authz.user.id;
  const role = authz.user.role;

  /* ── 2. Validate body ────────────────────────────────────────────── */
  const body = await parseJsonBody(request, PatchSchema);
  if (!body.ok) return body.response;
  const { status, notes } = body.data;

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

  /* ── 6. Persist (conditional transition) ─────────────────────────── */
  // Fast-path pre-check above gives a friendly 409; the updateMany `where`
  // below makes the transition atomic — it only lands if the row is still
  // SEARCHING, so a concurrent PATCH that raced past its own pre-check
  // cannot double-append notes or re-close the row.
  const updatedNotes =
    notes && notes.length > 0
      ? `${search.notes ?? ""}${search.notes ? "\n" : ""}— closed: ${notes}`.trim()
      : search.notes;

  const transitioned = await prisma.lostPetSearch.updateMany({
    where: { searchId, status: "SEARCHING" },
    data: {
      status,
      closedAt: new Date(),
      notes: updatedNotes,
    },
  });

  if (transitioned.count === 0) {
    // Lost the race: another writer transitioned first. Re-read so the
    // message names the status that actually won.
    const current = await prisma.lostPetSearch.findUnique({
      where: { searchId },
      select: { status: true },
    });
    return NextResponse.json(
      {
        error: "Conflict",
        message: `Search is already ${current?.status ?? "resolved"} and cannot be transitioned.`,
      },
      { status: 409 },
    );
  }

  const updated = await prisma.lostPetSearch.findUnique({
    where: { searchId },
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

  if (!updated) {
    // Row vanished between the conditional update and this read.
    return NextResponse.json(
      { error: "Not Found", message: "No LostPetSearch with that id." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, search: updated }, { status: 200 });
}
