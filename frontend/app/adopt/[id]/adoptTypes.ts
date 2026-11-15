/**
 * Shared types + helpers for the adopter-facing profile
 * (app/adopt/[id]).
 */

export type InterestType = "ADOPT" | "FOSTER" | "CONTACT";

export type FormStatus = "idle" | "success" | "error";

/** Shape of the translator returned by `useI18n()`. */
export type TrFn = (
  k: string,
  vars?: Record<string, string | number>,
) => string;

export type Dog = {
  id: number;
  publicId?: string;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
  sex?: "Male" | "Female";
  personality?: string;
  city?: string;
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
