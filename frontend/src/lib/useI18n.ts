/**
 * useI18n — shared client-side i18n hook for the RescueHub dashboard surface.
 * ====================================================================
 *
 * Single source of truth for the dashboard's locale-reactivity pattern.
 * Components consume `{ locale, tr }` and call `tr("dashboard.some.key", { x })`
 * to resolve a localized string at render time.
 *
 * Behavior:
 *   - Initial locale is read from `localStorage["rescuehub_locale"]` (if any).
 *     The legacy single-alias "zh" resolves to "zh-CN" (Simplified Mandarin)
 *     for backward compatibility with pre-Phase 6 storage entries.
 *   - When the user changes the locale via `<LocaleSwitch />`, a
 *     `rescuehub-locale-change` window event is fired and `tr` re-resolves
 *     against the current dictionary without a full reload.
 *   - `tr(key, vars?)` interpolates `{key}` placeholders using a `g` flag so
 *     a value can appear multiple times in the same string (e.g. `{count}`).
 *   - On miss, `tr` returns the dotted key — visible-but-actionable during
 *     development without crashing.
 *
 * Supported locales: en, es, zh-CN, zh-TW, ja, ko (+ legacy zh alias).
 *
 * All locale JSON files are imported eagerly (synchronous) so the very first
 * render uses the correct dictionary. The webpack/turbopack chunk graph
 * dedupes identical imports across components, so this has no measurable cost.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import enDict from "../../locales/en.json";
import esDict from "../../locales/es.json";
import zhCNDict from "../../locales/zh-CN.json";
import zhTWDict from "../../locales/zh-TW.json";
import jaDict from "../../locales/ja.json";
import koDict from "../../locales/ko.json";
import zhLegacyDict from "../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
  zh: zhLegacyDict as unknown as Record<string, unknown>,
};

export const STORAGE_KEY = "rescuehub_locale";
const LOCALE_CHANGE_EVENT = "rescuehub-locale-change";

export type LocaleCode =
  | "en"
  | "es"
  | "zh-CN"
  | "zh-TW"
  | "ja"
  | "ko";

/**
 * Resolve a stored locale string into a supported `LocaleCode`.
 * Falls back to `"en"`. The legacy `"zh"` alias resolves to `"zh-CN"`
 * so any user still carrying pre-Phase 6 storage keeps getting Simplified
 * Mandarin instead of English.
 */
export function resolveLocale(stored: string | null | undefined): LocaleCode {
  if (
    stored === "en" ||
    stored === "es" ||
    stored === "zh-CN" ||
    stored === "zh-TW" ||
    stored === "ja" ||
    stored === "ko"
  ) {
    return stored;
  }
  if (stored === "zh") return "zh-CN";
  return "en";
}

/**
 * Resolve a dotted key-path against a locale dictionary. Returns the key
 * itself on any miss so missing translations surface visibly without
 * crashing the page.
 */
export function resolveKey(
  locale: string,
  key: string,
): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS.en;
  const parts = key.split(".");
  let value: unknown = dict;
  for (const part of parts) {
    if (typeof value !== "object" || value === null) return key;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : key;
}
/**
 * Translate `key` against the dictionary for `locale`, interpolating
 * `{name}`-style placeholders with `vars`.
 *
 * Use this directly in non-component code (server components, helpers).
 * Inside a React component, prefer the `useI18n()` hook so that re-renders
 * fire on locale-change events.
 */
export function t(
  locale: string,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = resolveKey(locale, key);
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) => {
    return str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }, value);
}

/**
 * `useI18n()` — localStorage + window-event reactive translator.
 *
 * Returns:
 *   - `locale`: current LocaleCode
 *   - `tr(key, vars?)`: translates against current locale
 *   - `setLocale(code)`: programmatically set + persist + broadcast
 */
export function useI18n() {
  const [locale, setLocaleState] = useState<LocaleCode>("en");

  // Initial pull from localStorage.
  // Note: `setLocaleState` is intentionally called inside the effect — this is
  // the standard "sync-from-external-storage" pattern every component in the
  // codebase uses (AnimalTable, TokenWalletCard.client, etc.). Acceptable here
  // because the call happens exactly once on mount, before user interaction.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocaleState(resolveLocale(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* default English */
    }
  }, []);

  // Re-render on locale-change events from <LocaleSwitch />.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        setLocaleState(resolveLocale(window.localStorage.getItem(STORAGE_KEY)));
      } catch {
        /* default English */
      }
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
    return () =>
      window.removeEventListener(LOCALE_CHANGE_EVENT, handler as EventListener);
  }, []);

  const tr = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      t(locale, key, vars),
    [locale],
  );

  const setLocale = useCallback((code: string) => {
    const resolved = resolveLocale(code);
    setLocaleState(resolved);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, resolved);
      } catch {
        /* noop */
      }
    }
  }, []);

  return { locale, tr, setLocale };
}
