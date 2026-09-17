/**
 * English fallbacks for translation keys that are not yet present in
 * locales/*.json (that directory is owned outside the radar scope).
 *
 * `tr()` returns the raw dotted key on a miss; these fallbacks keep the UI
 * showing the established English copy instead. The established fallback
 * pattern for brand-new keys is the English string in every locale — once
 * a key lands in locales/*.json, `tr()` wins and the fallback is ignored.
 */

import type { TrFn } from "./types";

export const EN_FALLBACKS: Record<string, string> = {
  "radar.share_error_create":
    "Couldn't create the share link right now. Please try again.",
  "radar.share_error_generic": "Couldn't create the share link right now.",
  "radar.share_error_claim": "Couldn't claim the free search right now.",
  "radar.share_error_claim_generic": "Couldn't claim the free search.",
  "radar.share_error_milestone": "The milestone isn't met yet — keep sharing!",
};

/**
 * Resolve `key` via `tr`, interpolating `{var}` placeholders, and fall
 * back to the English copy above when the key is missing from the active
 * dictionary.
 */
export function trWithFallback(
  tr: TrFn,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = tr(key, vars);
  if (value !== key) return value;
  const fallback = EN_FALLBACKS[key] ?? key;
  if (!vars) return fallback;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replaceAll(`{${k}}`, String(v)),
    fallback,
  );
}
