/**
 * holdRegulations — stray-hold (statutory holding period) compliance layer.
 * =========================================================================
 *
 * The "stray hold" is the minimum number of hours/days a shelter must hold a
 * found stray before it may be adopted, transferred, or euthanized, so the
 * owner has a legal window to reclaim it. Holding periods are set by STATE
 * and sometimes COUNTY statute — there is no single national number.
 *
 * ⚠️  COMPLIANCE NOTICE
 *   The values below are representative statutory minima compiled from public
 *   shelter-regulation sources. They change and vary by county/city, so the
 *   authoritative number MUST be re-confirmed with counsel + the local
 *   animal-control authority for every jurisdiction you operate in. The
 *   engine defaults to a conservative 72 hours when a jurisdiction is
 *   unknown or unlisted, and it always biases LONGER when in doubt.
 *
 * Usage:
 *   - `strayHoldHours(jurisdiction, hasOwnerId)` → hours to hold.
 *   - `computeStrayHoldExpiry(intakeTs, jurisdiction, hasOwnerId)` → Date.
 */

export type JurisdictionCode =
  | "US-CA"
  | "US-NY"
  | "US-TX"
  | "US-FL"
  | "US-IL"
  | "US-WA"
  | "US-OR"
  | "US-AZ"
  | "US-CO"
  | "US-GA"
  | "US-MI"
  | "US-OH"
  | "US-PA"
  | "US-MA"
  | "US-NJ"
  | "US-VA"
  | "US-NC"
  | "US-DEFAULT";

export interface HoldRule {
  /** Minimum hold in hours when the animal has NO owner-identification. */
  noIdHours: number;
  /** Minimum hold in hours when the animal HAS ID (tag/chip/collar). */
  withIdHours: number;
  /** Human-readable statute/source note (not legal advice). */
  note: string;
}

/**
 * Representative state stray-hold minima (hours). Re-verify before relying
 * on them in production — statutes change and local rules can extend them.
 */
export const HOLD_RULES: Record<JurisdictionCode, HoldRule> = {
  "US-CA": { noIdHours: 72, withIdHours: 120, note: "CA: 72h (4 business days with ID under many municipal codes); county rules may extend." },
  "US-NY": { noIdHours: 120, withIdHours: 168, note: "NY: 5 days no ID / 7 days with ID (Agriculture & Markets Law § 374)." },
  "US-TX": { noIdHours: 72, withIdHours: 120, note: "TX: 72h no ID / 5 days with ID (Health & Safety Code § 821)." },
  "US-FL": { noIdHours: 120, withIdHours: 168, note: "FL: 5 days no ID / 7 days with ID (F.S. § 823.15)." },
  "US-IL": { noIdHours: 168, withIdHours: 168, note: "IL: 7 days (Animal Welfare Act 510 ILCS 5)." },
  "US-WA": { noIdHours: 72, withIdHours: 72, note: "WA: 72h (RCW 16.52.011)." },
  "US-OR": { noIdHours: 72, withIdHours: 72, note: "OR: 72h (ORS 609.341)." },
  "US-AZ": { noIdHours: 72, withIdHours: 168, note: "AZ: 72h no ID / 7 days with ID (A.R.S. § 11-1007)." },
  "US-CO": { noIdHours: 120, withIdHours: 120, note: "CO: 5 days (C.R.S. § 35-42-107)." },
  "US-GA": { noIdHours: 72, withIdHours: 72, note: "GA: 72h (O.C.G.A. § 4-11-14)." },
  "US-MI": { noIdHours: 96, withIdHours: 96, note: "MI: 4 days (MCL 287.387)." },
  "US-OH": { noIdHours: 72, withIdHours: 72, note: "OH: 72h (R.C. § 955.16)." },
  "US-PA": { noIdHours: 48, withIdHours: 168, note: "PA: 48h no ID / 7 days with ID (3 P.S. § 328-202)." },
  "US-MA": { noIdHours: 168, withIdHours: 168, note: "MA: 7 days (M.G.L. c. 140 § 151A)." },
  "US-NJ": { noIdHours: 168, withIdHours: 168, note: "NJ: 7 days (N.J.S.A. 4:19-15.16)." },
  "US-VA": { noIdHours: 120, withIdHours: 240, note: "VA: 5 days no ID / 10 days with ID (Va. Code § 3.2-6546)." },
  "US-NC": { noIdHours: 72, withIdHours: 72, note: "NC: 72h (N.C.G.S. § 19A-32)." },
  "US-DEFAULT": { noIdHours: 72, withIdHours: 72, note: "Default conservative 72h where jurisdiction is unknown." },
};

/** Fallback when the jurisdiction code is unknown or omitted. */
export const DEFAULT_HOLD_HOURS = 72;

/** Normalize arbitrary strings (e.g. "CA", "US-CA", "California") to a code. */
export function resolveJurisdiction(input?: string | null): JurisdictionCode {
  if (!input) return "US-DEFAULT";
  const s = input.trim().toUpperCase();
  if (s === "CA" || s === "CALIFORNIA") return "US-CA";
  if (s === "NY" || s === "NEW YORK") return "US-NY";
  if (s === "TX" || s === "TEXAS") return "US-TX";
  if (s === "FL" || s === "FLORIDA") return "US-FL";
  if (s === "IL" || s === "ILLINOIS") return "US-IL";
  if (s === "WA" || s === "WASHINGTON") return "US-WA";
  if (s === "OR" || s === "OREGON") return "US-OR";
  if (s === "AZ" || s === "ARIZONA") return "US-AZ";
  if (s === "CO" || s === "COLORADO") return "US-CO";
  if (s === "GA" || s === "GEORGIA") return "US-GA";
  if (s === "MI" || s === "MICHIGAN") return "US-MI";
  if (s === "OH" || s === "OHIO") return "US-OH";
  if (s === "PA" || s === "PENNSYLVANIA") return "US-PA";
  if (s === "MA" || s === "MASSACHUSETTS") return "US-MA";
  if (s === "NJ" || s === "NEW JERSEY") return "US-NJ";
  if (s === "VA" || s === "VIRGINIA") return "US-VA";
  if (s === "NC" || s === "NORTH CAROLINA") return "US-NC";
  if ((s.startsWith("US-") || /^[A-Z]{2}$/.test(s)) && s in HOLD_RULES) {
    return s as JurisdictionCode;
  }
  return "US-DEFAULT";
}

/** Hold hours for a jurisdiction, given whether the animal carries owner ID. */
export function strayHoldHours(
  jurisdiction?: string | null,
  hasOwnerId = false,
): number {
  const rule = HOLD_RULES[resolveJurisdiction(jurisdiction)];
  return hasOwnerId ? rule.withIdHours : rule.noIdHours;
}

/** Compute the stray-hold expiry timestamp from intake time + jurisdiction. */
export function computeStrayHoldExpiry(
  intakeTimestamp: Date | string,
  jurisdiction?: string | null,
  hasOwnerId = false,
): Date | null {
  const intakeMs =
    typeof intakeTimestamp === "string"
      ? new Date(intakeTimestamp).getTime()
      : intakeTimestamp.getTime();
  // NaN / invalid dates must NOT silently resolve to "now" (which would make
  // the hold appear instantly cleared). Return null so callers can default to
  // a conservative hold instead.
  if (Number.isNaN(intakeMs)) return null;
  return new Date(intakeMs + strayHoldHours(jurisdiction, hasOwnerId) * 3600_000);
}

/** Whether the statutory hold has been served as of `now`. */
export function isStatutoryHoldCleared(
  intakeTimestamp: Date | string,
  jurisdiction?: string | null,
  hasOwnerId = false,
  now: Date = new Date(),
): boolean {
  const expiry = computeStrayHoldExpiry(intakeTimestamp, jurisdiction, hasOwnerId);
  if (!expiry) return false;
  return now.getTime() >= expiry.getTime();
}
