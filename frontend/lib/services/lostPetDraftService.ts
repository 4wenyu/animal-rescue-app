/**
 * Lost-pet intake draft — Prisma persistence for signed-in owners.
 * Photos are never accepted; client already strips them.
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isMeaningfulDraft,
  type DraftMessage,
  type LostPetDraft,
} from "@/src/components/chat/lostPetDraft";

const MAX_MESSAGES = 40;
const MAX_CONTENT = 2000;

function clipMessages(messages: DraftMessage[]): DraftMessage[] {
  return messages.slice(-MAX_MESSAGES).map((m) => ({
    id: String(m.id).slice(0, 80),
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content ?? "").slice(0, MAX_CONTENT),
  }));
}

function asDraftMessages(raw: unknown): DraftMessage[] {
  if (!Array.isArray(raw)) return [];
  return clipMessages(
    raw.filter((m): m is DraftMessage => {
      if (!m || typeof m !== "object") return false;
      const row = m as DraftMessage;
      return (
        (row.role === "user" || row.role === "assistant") &&
        typeof row.content === "string"
      );
    }),
  );
}

export function rowToDraft(row: {
  messages: Prisma.JsonValue;
  accumulated: Prisma.JsonValue;
  savedAt: Date;
}): LostPetDraft | null {
  const messages = asDraftMessages(row.messages);
  const accumulated =
    row.accumulated &&
    typeof row.accumulated === "object" &&
    !Array.isArray(row.accumulated)
      ? (row.accumulated as Record<string, unknown>)
      : {};
  if (!isMeaningfulDraft(messages, accumulated)) return null;
  return { messages, accumulated, savedAt: row.savedAt.getTime() };
}

export async function getLostPetIntakeDraft(
  userId: string,
): Promise<LostPetDraft | null> {
  const row = await prisma.lostPetIntakeDraft.findUnique({
    where: { userId },
  });
  if (!row) return null;
  return rowToDraft(row);
}

export async function upsertLostPetIntakeDraft(
  userId: string,
  messages: DraftMessage[],
  accumulated: Record<string, unknown>,
  savedAtMs?: number,
): Promise<LostPetDraft | null> {
  const clipped = clipMessages(messages);
  if (!isMeaningfulDraft(clipped, accumulated)) {
    await prisma.lostPetIntakeDraft.deleteMany({ where: { userId } });
    return null;
  }
  const savedAt = new Date(
    typeof savedAtMs === "number" && Number.isFinite(savedAtMs)
      ? savedAtMs
      : Date.now(),
  );
  const row = await prisma.lostPetIntakeDraft.upsert({
    where: { userId },
    create: {
      userId,
      messages: clipped as unknown as Prisma.InputJsonValue,
      accumulated: accumulated as Prisma.InputJsonValue,
      savedAt,
    },
    update: {
      messages: clipped as unknown as Prisma.InputJsonValue,
      accumulated: accumulated as Prisma.InputJsonValue,
      savedAt,
    },
  });
  return rowToDraft(row);
}

export async function deleteLostPetIntakeDraft(userId: string): Promise<void> {
  await prisma.lostPetIntakeDraft.deleteMany({ where: { userId } });
}
