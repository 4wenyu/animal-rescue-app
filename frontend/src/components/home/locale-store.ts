"use client";

// Locale store for the home islands — keeps the page's existing contract
// (localStorage "rescuehub_locale" + "rescuehub-locale-change" event) while
// reading storage via useSyncExternalStore instead of a set-state-in-effect
// mount cascade. SSR/hydration render English; stored locale applies after
// hydration, and LocaleSwitch flips every subscriber via the same event.
import { useSyncExternalStore } from "react";
import { isLocale, t, type LocaleCode, type TranslateFn } from "./home-strings";

const STORAGE_KEY = "rescuehub_locale";
const LOCALE_CHANGE_EVENT = "rescuehub-locale-change";

let current: LocaleCode = "en";
let initialized = false;
const listeners = new Set<() => void>();

function initFromStorage() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    current = isLocale(stored) ? stored : "en";
  } catch {
    current = "en";
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Read storage after hydrate so SSR English matches the first client paint.
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      const before = current;
      initFromStorage();
      if (current !== before) {
        for (const notify of listeners) notify();
      }
    });
  }
  const onLocaleChange = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!isLocale(detail) || detail === current) return;
    current = detail;
    for (const notify of listeners) notify();
  };
  window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
  };
}

function getSnapshot(): LocaleCode {
  return current;
}

function getServerSnapshot(): LocaleCode {
  return "en";
}

/** Current locale — SSR renders "en", then hydrates from storage/event. */
export function useLocale(): LocaleCode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Translator bound to the current locale (same dictionary pattern as before). */
export function useHomeLocale(): { locale: LocaleCode; tr: TranslateFn } {
  const locale = useLocale();
  const tr: TranslateFn = (key, vars) => t(locale, key, vars);
  return { locale, tr };
}
