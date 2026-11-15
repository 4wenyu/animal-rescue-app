/**
 * PATCH /api/adoption-interest/[interestId]
 * Staff queue: move a saved request between NEW, CONTACTED, and CLOSED.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { parseJsonBody, requireRole } from "@/lib/api/helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const StatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ interestId: string }> },
) {
  const authz = await requireRole("STAFF", "ADMIN");
  if (!authz.ok) return authz.response;

  const { interestId } = await context.params;
  const body = await parseJsonBody(request, StatusSchema);
  if (!body.ok) return body.response;

  try {
    const lead = await prisma.adoptionInterest.update({
      where: { interestId },
      data: { status: body.data.status },
      select: {
        interestId: true,
        animalId: true,
        animalName: true,
        interestType: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, lead }, { status: 200 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Not Found", message: "No adoption request with that id." },
        { status: 404 },
      );
    }
    console.error("[api/adoption-interest] update failed:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Could not update the request." },
      { status: 500 },
    );
  }
}
