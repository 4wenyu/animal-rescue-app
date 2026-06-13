/**
 * Minimal i18n utility for ESIGN/UETA multi-language support.
 *
 * Loads locale JSON dictionaries and provides a simple `t()` function.
 * The locale is stored in localStorage and can be toggled via <LocaleSwitch />.
 *
 * Supported locales: "en", "es", "zh"
 */

type Locale = "en" | "es" | "zh";

const STORAGE_KEY = "rescuehub_locale";
const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: {},
  es: {},
  zh: {},
};

let current: Locale = DEFAULT_LOCALE;

function loadFromStorage(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es" || stored === "zh") return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE;
}

export async function initI18n(): Promise<void> {
  current = loadFromStorage();
  try {
    const en = await import(`../../locales/${current}.json`);
    dictionaries[current] = en.default ?? en;
  } catch {
    // Fallback to empty dict
  }
}

/** Get the current locale code */
export function getLocale(): Locale {
  return current;
}

/**
 * Simple key-path template function.
 *
 * Usage:
 *   t("hero.headline")                         => string
 *   t("adoption_feed.available", { count: 10 }) => string with {count} replaced
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let value: unknown = dictionaries[current];
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }, value);
}

/** Persist a locale selection and return it */
export function setLocale(locale: Locale): void {
  current = locale;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // noop
    }
  }
  // Reload the dictionary for the new locale
  import(`../../locales/${locale}.json`).then((mod) => {
    dictionaries[locale] = mod.default ?? mod;
  });
}

export type { Locale };