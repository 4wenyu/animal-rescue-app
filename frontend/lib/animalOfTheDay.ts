type Listed = { euthanasia_risk_status: string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function calendarYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function adoptableDogs<T extends Listed>(dogs: readonly T[]): T[] {
  return dogs.filter((d) => d.euthanasia_risk_status !== "IMMEDIATE_BEHAVIORAL");
}

function dayIndex(date: Date): number {
  const key = calendarYmd(date);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Same animal for every visitor on a given local calendar day. */
export function animalOfTheDay<T extends Listed>(
  dogs: readonly T[],
  date = new Date(),
): T | null {
  const pool = adoptableDogs(dogs);
  if (pool.length === 0) return null;
  return pool[dayIndex(date) % pool.length] ?? null;
}

export function animalOfTomorrow<T extends Listed>(
  dogs: readonly T[],
  date = new Date(),
): T | null {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return animalOfTheDay(dogs, next);
}
