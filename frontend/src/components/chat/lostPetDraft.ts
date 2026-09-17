/**
 * Lost-pet intake draft — local persistence for a distressed owner who
 * backgrounds the tab or drops a mobile connection. Photos are not stored
 * (localStorage is too small / sensitive); captured fields + transcript are.
 */

export const LOST_PET_DRAFT_KEY = "rescuehub_lost_pet_draft";

/** Replaced with the localized greeting on mount; never shown to the owner. */
export const OPENING_HOOK_SENTINEL = "__open_hook_placeholder__";

export type DraftMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type LostPetDraft = {
  messages: DraftMessage[];
  accumulated: Record<string, unknown>;
  savedAt: number;
};

const MAX_MESSAGES = 40;
const MAX_CONTENT = 2000;

function clipMessages(messages: DraftMessage[]): DraftMessage[] {
  return messages.slice(-MAX_MESSAGES).map((m) => ({
    id: String(m.id).slice(0, 80),
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content ?? "").slice(0, MAX_CONTENT),
  }));
}

/** True when the transcript has more than the opening greeting. */
export function isMeaningfulDraft(
  messages: DraftMessage[],
  accumulated: Record<string, unknown>,
): boolean {
  const hasFields = Object.values(accumulated).some(
    (v) => v !== null && v !== undefined && String(v).trim().length > 0,
  );
  const spoken = messages.filter(
    (m) => m.id !== "opening-hook" && m.content.trim().length > 0,
  );
  return hasFields || spoken.length > 0;
}

export function serializeLostPetDraft(
  messages: DraftMessage[],
  accumulated: Record<string, unknown>,
): string {
  const draft: LostPetDraft = {
    messages: clipMessages(messages),
    accumulated,
    savedAt: Date.now(),
  };
  return JSON.stringify(draft);
}

export function parseLostPetDraft(raw: string | null | undefined): LostPetDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LostPetDraft>;
    if (!Array.isArray(parsed.messages)) return null;
    const messages = clipMessages(
      parsed.messages.filter(
        (m): m is DraftMessage =>
          !!m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      ),
    );
    const accumulated =
      parsed.accumulated && typeof parsed.accumulated === "object"
        ? (parsed.accumulated as Record<string, unknown>)
        : {};
    if (!isMeaningfulDraft(messages, accumulated)) return null;
    return {
      messages,
      accumulated,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function readLostPetDraft(): LostPetDraft | null {
  if (typeof window === "undefined") return null;
  try {
    return parseLostPetDraft(localStorage.getItem(LOST_PET_DRAFT_KEY));
  } catch {
    return null;
  }
}

export function writeLostPetDraft(
  messages: DraftMessage[],
  accumulated: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (!isMeaningfulDraft(messages, accumulated)) return;
  try {
    localStorage.setItem(
      LOST_PET_DRAFT_KEY,
      serializeLostPetDraft(messages, accumulated),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearLostPetDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOST_PET_DRAFT_KEY);
  } catch {
    /* noop */
  }
}
