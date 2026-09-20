/** Tokenize a free-text region so "Harborview, CA" overlaps "harborview". */
export function regionTokens(label: string | null | undefined): string[] {
  if (!label) return [];
  return label
    .toLowerCase()
    .split(/[\s,;/-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

/**
 * Overlap = at least one shared token. Empty either side means "unknown
 * geography" — we do not pretend we geo-fenced, we just do not exclude.
 */
export function regionsOverlap(
  profileRegion: string | null | undefined,
  animalRegion: string | null | undefined,
): boolean {
  const profile = regionTokens(profileRegion);
  const animal = regionTokens(animalRegion);
  if (profile.length === 0 || animal.length === 0) return true;
  return profile.some((token) => animal.includes(token));
}

export function regionMatchNote(
  profileRegion: string | null | undefined,
  animalRegion: string | null | undefined,
): string {
  const profile = regionTokens(profileRegion);
  const animal = regionTokens(animalRegion);
  if (profile.length === 0 || animal.length === 0) {
    return "region matching skipped (missing region on profile or animal)";
  }
  if (profile.some((token) => animal.includes(token))) {
    return `region matched (${profileRegion} ≈ ${animalRegion})`;
  }
  return "region did not overlap — skipped this animal";
}
