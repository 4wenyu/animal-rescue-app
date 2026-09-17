/**
 * Locale helpers safe to import from Server Components (no "use client").
 * Cookie + localStorage share the same key so SSR `<html lang>` matches
 * the visitor's last choice after the first client write.
 */

export const STORAGE_KEY = "rescuehub_locale";
export const LOCALE_COOKIE = "rescuehub_locale";

export type LocaleCode = "en" | "es" | "zh-CN" | "zh-TW" | "ja" | "ko";

const ALLOWED: ReadonlySet<string> = new Set([
  "en",
  "es",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
]);

export function resolveLocale(stored: string | null | undefined): LocaleCode {
  if (stored && ALLOWED.has(stored)) return stored as LocaleCode;
  if (stored === "zh") return "zh-CN";
  return "en";
}

/** Persist the locale as a cookie the root layout can read on the next request. */
export function writeLocaleCookie(locale: LocaleCode): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
