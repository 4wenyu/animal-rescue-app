const STORAGE_KEY = "rescuehub_met_album_v1";

export function readMetIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { ids?: unknown };
    if (!Array.isArray(parsed.ids)) return [];
    return parsed.ids.filter((id): id is number => typeof id === "number");
  } catch {
    return [];
  }
}

export function rememberMet(ids: number[]): number[] {
  const next = [...new Set([...readMetIds(), ...ids])];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: next }));
  } catch {
    // Private mode — still return the merged list for this session.
  }
  return next;
}
