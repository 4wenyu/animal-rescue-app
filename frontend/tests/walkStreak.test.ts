import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bumpWalkStreak } from "@/src/components/dashboard/walkStreak";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  get length() {
    return this.data.size;
  }
}

describe("kennel-walk streak", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts at one day", () => {
    const now = new Date("2026-09-17T12:00:00");
    expect(bumpWalkStreak(now)).toEqual({ lastYmd: "2026-09-17", days: 1 });
  });

  it("does not double-count the same calendar day", () => {
    const now = new Date("2026-09-17T12:00:00");
    bumpWalkStreak(now);
    expect(bumpWalkStreak(now).days).toBe(1);
  });

  it("increments consecutive days", () => {
    bumpWalkStreak(new Date("2026-09-16T12:00:00"));
    expect(bumpWalkStreak(new Date("2026-09-17T08:00:00")).days).toBe(2);
  });

  it("resets after a missed day", () => {
    bumpWalkStreak(new Date("2026-09-14T12:00:00"));
    expect(bumpWalkStreak(new Date("2026-09-17T12:00:00")).days).toBe(1);
  });
});
