const STORAGE_KEY = "rescuehub_kennel_walk_v1";

export type WalkStreak = {
  lastYmd: string;
  days: number;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function yesterdayYmd(from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);
  return toYmd(d);
}

export function readWalkStreak(): WalkStreak | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalkStreak;
    if (typeof parsed.lastYmd !== "string" || typeof parsed.days !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function bumpWalkStreak(now = new Date()): WalkStreak {
  const today = toYmd(now);
  const prev = readWalkStreak();
  const next: WalkStreak =
    !prev || prev.lastYmd !== today
      ? {
          lastYmd: today,
          days: prev?.lastYmd === yesterdayYmd(now) ? prev.days + 1 : 1,
        }
      : prev;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / missing storage — still return the in-memory streak.
  }
  return next;
}
