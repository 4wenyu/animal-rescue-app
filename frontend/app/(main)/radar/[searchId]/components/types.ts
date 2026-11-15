/**
 * Shared types for the /radar/[searchId] view tree.
 *
 * Kept in one leaf module so sibling components can import the search-row
 * DTO without depending on the view or on each other.
 */

export type SearchStatus = "SEARCHING" | "FOUND" | "CANCELLED";

/** One animal already on this shelter's public list. */
export interface RosterHitDto {
  animalId: string;
  profileId: string;
  name: string;
  species: string;
  breed: string;
  city: string | null;
  imageUrl: string | null;
}

export interface SearchDto {
  searchId: string;
  userId: string;
  species: string | null;
  breed: string | null;
  colorMarkings: string | null;
  collarId: string | null;
  lastSeen: string | null;
  status: SearchStatus;
  debitTxnId: string | null;
  activatedAt: string;
  closedAt: string | null;
  notes: string | null;
  rosterMatches?: RosterHitDto[];
}

/** Shape of the translator returned by `useI18n()`. */
export type TrFn = (
  k: string,
  vars?: Record<string, string | number>,
) => string;
