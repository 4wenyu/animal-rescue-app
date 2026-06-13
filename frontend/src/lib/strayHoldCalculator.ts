/**
 * strayHoldCalculator.ts
 *
 * Blueprint §3 — Stray Hold Rule Engine
 * Calculates the exact time remaining on a statutory stray hold
 * relative to the current system time (new Date()).
 *
 * US statutory stray hold norms vary by state — the default
 * 72-hour hold is a common baseline. The caller provides the
 * actual jurisdiction's hold duration via holdDurationHours.
 */

export type HoldStatus = "Active" | "Cleared" | "Overdue";

export interface StrayHoldResult {
  /** One of "Active" | "Cleared" | "Overdue" */
  status: HoldStatus;
  /**
   * Human-readable time string. Examples:
   *   "48h 12m remaining"
   *   "2d 5h remaining"
   *   "Cleared — no active hold"
   *   "3d 18h overdue"
   */
  timeString: string;
  /** Total milliseconds remaining (negative = overdue) */
  remainingMs: number;
  /** Total hours elapsed since intake */
  elapsedHours: number;
  /** Total hours in the statutory hold window */
  holdDurationHours: number;
}

/**
 * Compute the stray hold status for an animal.
 *
 * @param intakeDate - ISO 8601 string of when the animal entered the shelter
 * @param holdDurationHours - jurisdiction-specific stray hold window (default 72)
 * @param statutoryHoldCleared - whether the hold has been administratively cleared
 *
 * @returns StrayHoldResult
 */
export function getStrayHold(
  intakeDate: string,
  holdDurationHours: number = 72,
  statutoryHoldCleared: boolean = false,
): StrayHoldResult {
  // ── Cleared (administrative override) ───────────────────────────────────
  if (statutoryHoldCleared) {
    return {
      status: "Cleared",
      timeString: "Cleared — no active hold",
      remainingMs: 0,
      elapsedHours: 0,
      holdDurationHours,
    };
  }

  const now = Date.now();
  const intakeMs = new Date(intakeDate).getTime();

  if (isNaN(intakeMs)) {
    return {
      status: "Cleared",
      timeString: "Invalid intake date",
      remainingMs: 0,
      elapsedHours: 0,
      holdDurationHours,
    };
  }

  const elapsedMs = now - intakeMs;
  const holdMs = holdDurationHours * 60 * 60 * 1000;
  const remainingMs = holdMs - elapsedMs;

  const elapsedHours = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60)));
  const remainingHours = remainingMs / (1000 * 60 * 60);

  // ── Overdue ────────────────────────────────────────────────────────────
  if (remainingMs <= 0) {
    const overdueAbs = Math.abs(remainingMs);
    const overdueHours = Math.floor(overdueAbs / (1000 * 60 * 60));
    const overdueDays = Math.floor(overdueHours / 24);
    const overdueHrs = overdueHours % 24;

    const timeString =
      overdueDays > 0
        ? `${overdueDays}d ${overdueHrs}h overdue`
        : `${overdueHours}h overdue`;

    return { status: "Overdue", timeString, remainingMs, elapsedHours, holdDurationHours };
  }

  // ── Active — compute precise remaining time ────────────────────────────
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingTotalHours = Math.floor(remainingHours);
  const remainingDays = Math.floor(remainingTotalHours / 24);
  const remainingHrs = remainingTotalHours % 24;

  let timeString: string;
  if (remainingDays > 0) {
    timeString = `${remainingDays}d ${remainingHrs}h remaining`;
  } else if (remainingHrs > 0) {
    timeString = `${remainingHrs}h ${remainingMinutes}m remaining`;
  } else {
    timeString = `${remainingMinutes}m remaining`;
  }

  return { status: "Active", timeString, remainingMs, elapsedHours, holdDurationHours };
}

/**
 * Convenience shorthand when you only need the status and label string.
 */
export function getHoldLabel(
  intakeDate: string,
  holdDurationHours: number = 72,
  statutoryHoldCleared: boolean = false,
): { status: HoldStatus; label: string } {
  const result = getStrayHold(intakeDate, holdDurationHours, statutoryHoldCleared);
  return { status: result.status, label: result.timeString };
}