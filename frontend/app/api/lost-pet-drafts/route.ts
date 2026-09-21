/**
 * GET / PUT / DELETE /api/lost-pet-drafts
 * ========================================
 * Server-side lost-pet chat draft for signed-in citizens.
 * Anonymous callers keep localStorage only (401 on these routes).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireRole, parseJsonBody } from "@/lib/api/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  deleteLostPetIntakeDraft,
  getLostPetIntakeDraft,
  upsertLostPetIntakeDraft,
} from "@/lib/services/lostPetDraftService";
import { isMeaningfulDraft } from "@/src/components/chat/lostPetDraft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  id: z.string().min(1).max(80),
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const putBodySchema = z.object({
  messages: z.array(messageSchema).max(40),
  accumulated: z.record(z.string(), z.unknown()).default({}),
  savedAt: z.number().int().positive().optional(),
});

function clientKey(req: NextRequest, userId: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `lost-pet-draft:${userId}:${fwd ?? "unknown"}`;
}

export async function GET(req: NextRequest) {
  const gate = await requireRole();
  if (!gate.ok) return gate.response;

  const limited = checkRateLimit(clientKey(req, gate.user.id), 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Slow down." },
      { status: 429 },
    );
  }

  const draft = await getLostPetIntakeDraft(gate.user.id);
  return NextResponse.json({ ok: true, draft });
}

export async function PUT(req: NextRequest) {
  const gate = await requireRole();
  if (!gate.ok) return gate.response;

  const limited = checkRateLimit(clientKey(req, gate.user.id), 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Slow down." },
      { status: 429 },
    );
  }

  const parsed = await parseJsonBody(req, putBodySchema);
  if (!parsed.ok) return parsed.response;

  const { messages, accumulated, savedAt } = parsed.data;
  if (!isMeaningfulDraft(messages, accumulated)) {
    await deleteLostPetIntakeDraft(gate.user.id);
    return NextResponse.json({ ok: true, draft: null });
  }

  const draft = await upsertLostPetIntakeDraft(
    gate.user.id,
    messages,
    accumulated,
    savedAt,
  );
  return NextResponse.json({ ok: true, draft });
}

export async function DELETE(req: NextRequest) {
  const gate = await requireRole();
  if (!gate.ok) return gate.response;

  await deleteLostPetIntakeDraft(gate.user.id);
  return NextResponse.json({ ok: true });
}
