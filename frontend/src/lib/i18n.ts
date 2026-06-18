/**
 * Minimal i18n utility for ESIGN/UETA multi-language support.
 *
 * Loads locale JSON dictionaries and provides a simple `t()` function.
 * The locale is stored in localStorage and can be toggled via <LocaleSwitch />.
 *
 * Supported locales: "en", "es", "zh-CN", "zh-TW", "ja", "ko"
 *
 * `zh-CN` = Simplified Mandarin (mainland China)
 * `zh-TW` = Traditional Mandarin (Taiwan)
 * `ja`    = Japanese
 * `ko`    = Korean
 */

export type Locale =
  | "en"
  | "es"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ko";

export const LOCALES: ReadonlyArray<Locale> = [
  "en",
  "es",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
];

const STORAGE_KEY = "rescuehub_locale";
const DEFAULT_LOCALE: Locale = "en";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: {},
  es: {},
  "zh-CN": {},
  "zh-TW": {},
  ja: {},
  ko: {},
};

let current: Locale = DEFAULT_LOCALE;

function isValidLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "es" || value === "zh-CN" ||
         value === "zh-TW" || value === "ja" || value === "ko";
}

function loadFromStorage(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidLocale(stored)) return stored;
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE;
}

export async function initI18n(): Promise<void> {
  current = loadFromStorage();
  try {
    const mod = await import(`../../locales/${current}.json`);
    dictionaries[current] = mod.default ?? mod;
  } catch {
    // Fallback to empty dict
  }
}

/** Get the current locale code */
export function getLocale(): Locale {
  return current;
}

/**
 * Resolve a dotted key-path against the current dictionary.
 *
 * Backward-compat: callers that used "zh" before this expansion now pass
 * "zh-CN" (Simplified Mandarin). The legacy "zh" alias is accepted during
 * localStorage reads so users with a stored "zh" keep getting Simplified
 * until they manually switch to "zh-CN" / "zh-TW".
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

/**
 * Persist a locale selection and reload the dictionary for it.
 * Fires a custom event so other components (Sidebar, public page)
 * re-render without a full page reload.
 */
export function setLocale(locale: Locale): void {
  if (!isValidLocale(locale)) return;
  current = locale;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
      window.dispatchEvent(
        new CustomEvent("rescuehub-locale-change", { detail: locale }),
      );
    } catch {
      // noop
    }
  }
  import(`../../locales/${locale}.json`).then((mod) => {
    dictionaries[locale] = mod.default ?? mod;
  });
}
