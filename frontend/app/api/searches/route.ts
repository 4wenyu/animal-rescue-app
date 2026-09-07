/**
 * POST /api/searches
 * ===================
 * Epic 3 / AI Agent Outreach Engine — Lost Pet Search persistence.
 *
 * Wired into the flow:
 *   - LostPetAgent streams a Zod object from /api/chat-intake as the
 *     user converses with the assistant.
 *   - When the engine reaches 5/5 fields, a "🚀 Activate Search Network"
 *     button surfaces in the sidebar.
 *   - Clicking it POSTs the captured object to THIS route.
 *   - We persist the search as a `LostPetSearch` row with status
 *     SEARCHING, return the generated searchId, and the client routes
 *     to `/radar/[searchId]` for the activity-feed payoff.
 *
 * Auth: same pattern as /api/tokens/transaction — session required, the
 * authenticated user.id is the owner of the row. Defense-in-depth: we
 * ignore any userId field in the body and overwrite with the session id.
 *
 * Idempotency: the request body carries the idempotency key minted when
 * the conversation's LOST_PET_SEARCH_SPEND ledger row was committed
 * (passed via the parent route's redirect URL). We tag it as
 * `notes.searchId` → no separate idempotency table is needed because
 * LostPetSearch rows are lifetime actions, not ledger entries. We
 * additionally de-duplicate by `(userId, debitTxnId)`: a single LOST
 * PET SEARCH SPEND may back exactly one LostPetSearch row, so if the
 * client double-fires the activate button we return the existing row.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Body validation                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Accepts the literal Zod shape that the chat-intake stream emits.
 *
 * Sprint B — relaxed "not sure / skip" contract: only `species` and
 * `lastSeen` are REQUIRED to start searching. `breed`, `colorMarkings`
 * and `collarId` are optional — an owner with no breed/collar must not
 * be locked out. Empty/blank optional fields are persisted as null
 * (schema columns are already nullable).
 */
function validateBody(body: Record<string, unknown>) {
  const errors: string[] = [];
  const out: {
    species: string;
    breed: string | null;
    colorMarkings: string | null;
    collarId: string | null;
    lastSeen: string;
    debitTxnId: string;
    notes?: string;
  } = {
    species: "",
    breed: null,
    colorMarkings: null,
    collarId: null,
    lastSeen: "",
    debitTxnId: "",
  };

  // Required — without these there is nothing to search for.
  for (const key of ["species", "lastSeen"] as const) {
    const raw = body[key];
    if (typeof raw !== "string" || raw.trim().length === 0) {
      errors.push(`${key} must be a non-empty string`);
      continue;
    }
    out[key] = raw.trim();
  }

  // Optional — "not sure" / "skip" is allowed; blank → null.
  for (const key of ["breed", "colorMarkings", "collarId"] as const) {
    const raw = body[key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      out[key] = raw.trim();
    }
  }

  // Required — a search must be backed by a completed payment. The debit
  // txnId is the idempotency key AND the pay-gate (see handler step 3).
  if (typeof body.debitTxnId === "string" && body.debitTxnId.trim().length > 0) {
    out.debitTxnId = body.debitTxnId.trim();
  } else {
    errors.push("debitTxnId must be a non-empty string");
  }
  if (typeof body.notes === "string" && body.notes.trim().length > 0) {
    out.notes = body.notes.trim();
  }

  return {
    ok: errors.length === 0,
    errors,
    data: errors.length === 0 ? out : null,
  };
}

/* -------------------------------------------------------------------------- */
/* POST handler                                                               */
/* -------------------------------------------------------------------------- */

export async function POST(request: Request) {
  /* ── 1. Authenticate ─────────────────────────────────────────────── */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const authenticatedUserId = session.user.id as string;

  /* ── 2. Parse + validate body ────────────────────────────────────── */
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json(
        { error: "Bad Request", message: "Body must be a JSON object." },
        { status: 400 },
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const validation = validateBody(body);
  if (!validation.ok || !validation.data) {
    return NextResponse.json(
      {
        error: "Validation Error",
        message: "Body failed validation.",
        details: validation.errors,
      },
      { status: 400 },
    );
  }
  const data = validation.data;

  /* ── 3. Pay-gate: resolve + verify the debit (required) ───────────── */
  // A search may only be activated against a completed LOST_PET_SEARCH_SPEND
  // that belongs to the caller. A missing/invalid pointer is NOT silently
  // nulled — it is rejected, so activation cannot happen for free.
  const debit = await prisma.tokenTransaction.findUnique({
    where: { txnId: data.debitTxnId },
    select: {
      userId: true,
      actionType: true,
      direction: true,
    },
  });

  if (
    !debit ||
    debit.userId !== authenticatedUserId ||
    debit.direction !== "SPEND" ||
    debit.actionType !== "LOST_PET_SEARCH_SPEND"
  ) {
    return NextResponse.json(
      {
        error: "Payment Required",
        message:
          "Search activation requires a completed LOST_PET_SEARCH_SPEND payment for your account.",
      },
      { status: 402 },
    );
  }

  /* ── 4. Idempotency guard via debitTxnId (1:1 with TokenTransaction) ── */
  const existing = await prisma.lostPetSearch.findUnique({
    where: { debitTxnId: data.debitTxnId },
    select: {
      searchId: true,
      userId: true,
      species: true,
      breed: true,
      colorMarkings: true,
      collarId: true,
      lastSeen: true,
      status: true,
      activatedAt: true,
    },
  });
  if (existing) {
    // Never leak another user's search row, even on replay.
    if (existing.userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: "Forbidden", message: "Search belongs to another user." },
        { status: 403 },
      );
    }
    // Idempotent replay — return the existing row.
    return NextResponse.json(
      {
        ok: true,
        idempotentReplay: true,
        search: existing,
      },
      { status: 200 },
    );
  }

  /* ── 5. Persist ───────────────────────────────────────────────────── */
  try {
    const created = await prisma.lostPetSearch.create({
      data: {
        userId: authenticatedUserId,
        species: data.species,
        breed: data.breed,
        colorMarkings: data.colorMarkings,
        collarId: data.collarId,
        lastSeen: data.lastSeen,
        status: "SEARCHING",
        debitTxnId: data.debitTxnId,
        notes: data.notes ?? null,
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
        activatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        idempotentReplay: false,
        search: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/searches] create failed:", err);
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation Error", message: "Internal Zod failure.", details: err.issues },
        { status: 400 },
      );
    }
    // Race: two concurrent activations for the same debit. Re-fetch the
    // committed row (it necessarily belongs to the caller, per step 3).
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const committed = await prisma.lostPetSearch.findUnique({
        where: { debitTxnId: data.debitTxnId },
        select: {
          searchId: true,
          userId: true,
          species: true,
          breed: true,
          colorMarkings: true,
          collarId: true,
          lastSeen: true,
          status: true,
          activatedAt: true,
        },
      });
      if (committed && committed.userId === authenticatedUserId) {
        return NextResponse.json(
          { ok: true, idempotentReplay: true, search: committed },
          { status: 200 },
        );
      }
    }
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not persist search." },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* GET handler — read-only fetch by searchId, or `?mine=1` list the caller's   */
/* searches (Sprint A — status timeline / "My searches").                      */
/* -------------------------------------------------------------------------- */

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required." },
      { status: 401 },
    );
  }
  const authenticatedUserId = session.user.id as string;

  const url = new URL(request.url);
  const searchId = url.searchParams.get("searchId");
  const mineOnly = url.searchParams.get("mine") === "1";

  /* ── My searches list ──────────────────────────────────────────────── */
  if (mineOnly) {
    const searches = await prisma.lostPetSearch.findMany({
      where: { userId: authenticatedUserId },
      orderBy: { activatedAt: "desc" },
      select: {
        searchId: true,
        userId: true,
        species: true,
        breed: true,
        colorMarkings: true,
        lastSeen: true,
        status: true,
        activatedAt: true,
        closedAt: true,
      },
      take: 50,
    });
    return NextResponse.json({ ok: true, searches }, { status: 200 });
  }

  if (!searchId) {
    return NextResponse.json(
      { error: "Bad Request", message: "searchId is required (or use ?mine=1)." },
      { status: 400 },
    );
  }

  const search = await prisma.lostPetSearch.findUnique({
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

  if (!search) {
    return NextResponse.json(
      { error: "Not Found", message: "No LostPetSearch with that id." },
      { status: 404 },
    );
  }

  // Ownership boundary — never leak another user's search row.
  if (search.userId !== authenticatedUserId) {
    return NextResponse.json(
      { error: "Forbidden", message: "Search belongs to another user." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, search }, { status: 200 });
}
