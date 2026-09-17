/**
 * English fallbacks for translation keys that are not yet present in
 * locales/*.json (that directory is owned outside the adopt scope).
 *
 * `tr()` returns the raw dotted key on a miss; these fallbacks keep the UI
 * showing the established English copy instead. The established fallback
 * pattern for brand-new keys is the English string in every locale — once
 * a key lands in locales/*.json, `tr()` wins and the fallback is ignored.
 */

import type { TrFn } from "./adoptTypes";

export const EN_FALLBACKS: Record<string, string> = {
  "adopt.hold_cta_note":
    "{name} is currently on a statutory hold. Adopt and foster " +
    "applications open once the hold clears — you can still donate or " +
    "contact the shelter.",
  "adopt.form_close": "Close",
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
