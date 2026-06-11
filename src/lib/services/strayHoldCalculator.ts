/**
 * Stray_Hold_Calculator
 *
 * Isolated microservice that computes the legal stray hold expiration
 * for an animal based on intake timestamp and jurisdiction rules.
 *
 * Jurisdiction rules:
 *   LA_COUNTY  -> 72 hour hold (3 weekdays)
 *   RIVERSIDE  -> 96 hour hold (4 weekdays)
 *
 * Weekends (Saturday/Sunday) are NOT counted in the hold duration.
 * The calculation advances by whole business days at the same time of day.
 */

export interface StrayHoldResult {
  expirationDate: Date;
  isCleared: boolean;
}

type JurisdictionCode = 'LA_COUNTY' | 'RIVERSIDE';

interface JurisdictionRule {
  holdBusinessDays: number;
}

const JURISDICTION_RULES: Record<JurisdictionCode, JurisdictionRule> = {
  LA_COUNTY: { holdBusinessDays: 3 },   // 72 hours
  RIVERSIDE: { holdBusinessDays: 4 },   // 96 hours
};

/**
 * Check if a given date falls on a weekend (Saturday=6, Sunday=0).
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Advance a date by a given number of business days (skipping weekends).
 * The time-of-day component is preserved throughout.
 */
function addBusinessDays(start: Date, businessDays: number): Date {
  const result = new Date(start);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Calculate stray hold status.
 *
 * @param intakeTimestamp - The datetime the animal was taken into custody.
 * @param jurisdictionCode - The legal jurisdiction governing the hold (e.g. 'LA_COUNTY').
 * @returns An object containing the computed expirationDate and whether the hold is cleared.
 */
export function calculateStrayHold(
  intakeTimestamp: Date,
  jurisdictionCode: JurisdictionCode
): StrayHoldResult {
  if (!(intakeTimestamp instanceof Date) || isNaN(intakeTimestamp.getTime())) {
    throw new Error('intakeTimestamp must be a valid Date object');
  }

  const rule = JURISDICTION_RULES[jurisdictionCode];
  if (!rule) {
    throw new Error(`Unknown jurisdiction code: ${jurisdictionCode}`);
  }

  const expirationDate = addBusinessDays(intakeTimestamp, rule.holdBusinessDays);
  const now = new Date();
  const isCleared = now >= expirationDate;

  return { expirationDate, isCleared };
}