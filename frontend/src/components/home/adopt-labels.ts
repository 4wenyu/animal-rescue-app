import type { TranslateFn } from "./home-strings";
import type { Dog, EuthanasiaRisk } from "./types";

// Label helpers shared by the adoption feed card and its grid header.

/** Risk chip text + token classes (adoption_feed.status.*). */
export function getRiskLabel(status: EuthanasiaRisk, tr: TranslateFn) {
  switch (status) {
    case "SAFE":
      return { text: tr("adoption_feed.status.available"), class: "text-emerald-700 bg-emerald-50" };
    case "AT_RISK":
      return { text: tr("adoption_feed.status.urgent_sponsor"), class: "text-amber-700 bg-amber-50" };
    case "IMMEDIATE_BEHAVIORAL":
      return { text: tr("adoption_feed.status.under_evaluation"), class: "text-slate-500 bg-slate-100" };
  }
}

export function getAgeLabel(age: number, tr: TranslateFn): string {
  return age === 1 ? `1 ${tr("common.year")}` : `${age} ${tr("common.years")}`;
}

/**
 * Sprint B — dignified deadline copy. Formats the animal's real
 * `strayHoldExpiresAt` date into "Needs a home by {date}" without a
 * fabricated ticking countdown (the old LiveTimer clock showed legal-jargon
 * HOLD OVERDUE states on a public adoption surface).
 */
export function getDeadlineLabel(
  animal: Dog,
  tr: TranslateFn,
): string | null {
  if (!animal.strayHoldExpiresAt) return null;
  const dateLabel = formatHoldDate(animal.strayHoldExpiresAt);
  if (!dateLabel) return null;
  return tr("adoption_feed.needs_home_by", { date: dateLabel });
}

/** UTC month+day — identical on server and client (no ICU locale drift). */
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatHoldDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
