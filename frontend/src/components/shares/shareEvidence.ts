/**
 * Helpers for staff share-evidence review (Kanban N2).
 * Keep parsing out of the client component so cards stay thin.
 */

export type ShareEvidence = {
  relatedSearchId?: string;
  relatedAnimalId?: string;
  source?: string;
  [key: string]: unknown;
};

export function parseShareEvidence(raw: unknown): ShareEvidence {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const row = raw as Record<string, unknown>;
  const out: ShareEvidence = {};
  if (typeof row.relatedSearchId === "string" && row.relatedSearchId) {
    out.relatedSearchId = row.relatedSearchId;
  }
  if (typeof row.relatedAnimalId === "string" && row.relatedAnimalId) {
    out.relatedAnimalId = row.relatedAnimalId;
  }
  if (typeof row.source === "string" && row.source) {
    out.source = row.source;
  }
  for (const [k, v] of Object.entries(row)) {
    if (k === "relatedSearchId" || k === "relatedAnimalId" || k === "source") continue;
    out[k] = v;
  }
  return out;
}

/** Only allow http(s) for staff "open proof" links. */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}
