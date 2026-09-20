// Home-page i18n — narrowed dictionary footprint.
// Preserves the app's dictionary pattern (direct JSON imports + dot-path
// lookup with {var} interpolation) while carrying ONLY the sections the
// home page renders, so the full locale dictionaries (dashboard, intake,
// outreach, chat, …) never enter the home page's client bundle.
import enDict from "@/locales/en.json";
import esDict from "@/locales/es.json";
import zhDict from "@/locales/zh.json";
import zhCNDict from "@/locales/zh-CN.json";
import zhTWDict from "@/locales/zh-TW.json";
import jaDict from "@/locales/ja.json";
import koDict from "@/locales/ko.json";

export const LOCALE_CODES = [
  "en", "es", "zh", "zh-CN", "zh-TW", "ja", "ko",
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export function isLocale(value: unknown): value is LocaleCode {
  return (
    typeof value === "string" &&
    (LOCALE_CODES as readonly string[]).includes(value)
  );
}

type Dict = Record<string, unknown>;

const HOME_SECTIONS = [
  "site", "nav", "hero", "play", "today", "preview", "adoption_feed", "sponsors", "breeds", "quick_links", "footer", "stay", "ambient",
] as const;

function pick(source: Dict, keys: readonly string[]): Dict {
  const out: Dict = {};
  for (const key of keys) {
    if (key in source) out[key] = source[key];
  }
  return out;
}

/** Narrow a full locale dictionary down to the home page's sections. */
function buildHomeDict(dict: Dict): Dict {
  return {
    ...pick(dict, HOME_SECTIONS),
    // Surgical picks — the home page needs only a few nested keys.
    medical: pick((dict.medical ?? {}) as Dict, ["Healthy", "Needs_Review"]),
    adopt: pick((dict.adopt ?? {}) as Dict, ["sex_male", "sex_female"]),
    common: pick((dict.common ?? {}) as Dict, ["year", "years"]),
  };
}

export const HOME_DICTS: Record<LocaleCode, Dict> = {
  en: buildHomeDict(enDict as unknown as Dict),
  es: buildHomeDict(esDict as unknown as Dict),
  zh: buildHomeDict(zhDict as unknown as Dict),
  "zh-CN": buildHomeDict(zhCNDict as unknown as Dict),
  "zh-TW": buildHomeDict(zhTWDict as unknown as Dict),
  ja: buildHomeDict(jaDict as unknown as Dict),
  ko: buildHomeDict(koDict as unknown as Dict),
};

export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>
) => string;

// Same resolution semantics as the original page-level helper: dot-path
// walk, fall back to the key itself when a segment is missing.
export function t(
  locale: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let value: unknown = HOME_DICTS[locale as LocaleCode] ?? HOME_DICTS.en;
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Dict)[part];
  }
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }, value);
}
