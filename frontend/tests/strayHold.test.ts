/**
 * Stray-hold clock (compliance-critical).
 *
 * A wrong answer here either euthanizes an animal before its statutory
 * reclaim window closes, or shows staff a cleared hold that is still running.
 */
import { describe, expect, it, afterEach, vi } from "vitest";

import { getStrayHold, getHoldLabel } from "@/src/lib/strayHoldCalculator";

/** Fixed "now" so the assertions do not depend on wall-clock time. */
const NOW = new Date("2026-03-10T12:00:00.000Z");

function at(hoursAgo: number): string {
  return new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString();
}

function freezeClock() {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getStrayHold", () => {
  it("reports Active while the hold is still running", () => {
    freezeClock();
    const result = getStrayHold(at(24), 72);

    expect(result.status).toBe("Active");
    expect(result.remainingMs).toBe(48 * 3600_000);
    expect(result.elapsedHours).toBe(24);
    expect(result.timeString).toBe("2d 0h remaining");
  });

  it("formats sub-day remainders in hours and minutes", () => {
    freezeClock();
    const result = getStrayHold(at(66.5), 72);

    expect(result.status).toBe("Active");
    expect(result.timeString).toBe("5h 30m remaining");
  });

  it("formats the final hour in minutes only", () => {
    freezeClock();
    expect(getStrayHold(at(71.5), 72).timeString).toBe("30m remaining");
  });

  it("flips to Overdue exactly at the boundary, not after it", () => {
    freezeClock();
    const result = getStrayHold(at(72), 72);

    // remainingMs === 0 must already count as Overdue: at the instant the
    // window closes the animal is no longer protected by the hold.
    expect(result.status).toBe("Overdue");
    expect(result.remainingMs).toBe(0);
  });

  it("reports Overdue with a negative remainder once the window has passed", () => {
    freezeClock();
    const result = getStrayHold(at(100), 72);

    expect(result.status).toBe("Overdue");
    expect(result.remainingMs).toBeLessThan(0);
    expect(result.timeString).toBe("1d 4h overdue");
  });

  it("honours an administrative clear without consulting the clock", () => {
    freezeClock();
    const result = getStrayHold(at(1), 72, true);

    expect(result.status).toBe("Cleared");
    expect(result.remainingMs).toBe(0);
  });

  it("does not treat an unparseable intake date as an expired hold", () => {
    freezeClock();
    const result = getStrayHold("not-a-date", 72);

    expect(result.status).not.toBe("Overdue");
    expect(result.timeString).toBe("Invalid intake date");
  });

  it("respects a jurisdiction-specific window longer than the default", () => {
    freezeClock();
    // 100h elapsed is overdue under a 72h rule but still active under 168h.
    expect(getStrayHold(at(100), 72).status).toBe("Overdue");
    expect(getStrayHold(at(100), 168).status).toBe("Active");
  });

  it("never reports negative elapsed hours for a future intake date", () => {
    freezeClock();
    const future = new Date(NOW.getTime() + 5 * 3600_000).toISOString();

    expect(getStrayHold(future, 72).elapsedHours).toBe(0);
  });
});

describe("getHoldLabel", () => {
  it("mirrors the status and time string of the full result", () => {
    freezeClock();
    const full = getStrayHold(at(24), 72);
    const label = getHoldLabel(at(24), 72);

    expect(label).toEqual({ status: full.status, label: full.timeString });
  });
});
