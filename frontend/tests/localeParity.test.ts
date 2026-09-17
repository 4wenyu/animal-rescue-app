/**
 * Locale dictionary parity.
 *
 * The UI renders raw dotted key-paths when a lookup misses (see `t()` in
 * src/lib/i18n.ts), so a single missing key ships visible garbage like
 * "hero.cta_lost_pet" to a Spanish or Japanese visitor. These tests make a
 * missing or mistyped key a build failure instead of a field report.
 */
import { describe, expect, it } from "vitest";

import en from "@/locales/en.json";
import es from "@/locales/es.json";
import ja from "@/locales/ja.json";
import ko from "@/locales/ko.json";
import zhCN from "@/locales/zh-CN.json";
import zhTW from "@/locales/zh-TW.json";
import zh from "@/locales/zh.json";

type Dict = Record<string, unknown>;

/** `en` is the source of truth; every other dictionary is compared to it. */
const TRANSLATIONS: ReadonlyArray<readonly [string, Dict]> = [
  ["es", es as Dict],
  ["zh-CN", zhCN as Dict],
  ["zh-TW", zhTW as Dict],
  ["ja", ja as Dict],
  ["ko", ko as Dict],
  ["zh", zh as Dict],
];

/** Flatten to the dotted key-paths `t()` actually resolves. */
function leafPaths(dict: Dict, prefix = ""): string[] {
  return Object.entries(dict).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? leafPaths(value as Dict, path)
      : [path];
  });
}

function leafAt(dict: Dict, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node !== null && typeof node === "object"
          ? (node as Dict)[part]
          : undefined,
      dict,
    );
}

/** `{name}`-style placeholders that must survive translation. */
function placeholders(value: string): string[] {
  return (value.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();
}

const EN_PATHS = leafPaths(en as Dict);

/**
 * `sponsorModal.body_translated` is intentionally absent from `en`, which
 * falls back to the canonical `sponsorModal.body`.
 */
const EN_EXEMPT = new Set(["sponsorModal.body_translated"]);

describe("en.json (source dictionary)", () => {
  it("has a non-trivial number of keys", () => {
    expect(EN_PATHS.length).toBeGreaterThan(300);
  });

  it("contains only string leaves", () => {
    const nonStrings = EN_PATHS.filter(
      (path) => typeof leafAt(en as Dict, path) !== "string",
    );

    expect(nonStrings).toEqual([]);
  });

  it("has no empty strings", () => {
    const empty = EN_PATHS.filter(
      (path) => (leafAt(en as Dict, path) as string).trim() === "",
    );

    expect(empty).toEqual([]);
  });
});

describe.each(TRANSLATIONS)("%s.json", (locale, dict) => {
  it("defines every key present in en.json", () => {
    const missing = EN_PATHS.filter(
      (path) => typeof leafAt(dict, path) !== "string",
    );

    expect(missing, `${locale} is missing ${missing.length} key(s)`).toEqual([]);
  });

  it("defines no keys that en.json lacks", () => {
    const extra = leafPaths(dict).filter(
      (path) => !EN_PATHS.includes(path) && !EN_EXEMPT.has(path),
    );

    expect(extra, `${locale} has orphaned key(s)`).toEqual([]);
  });

  it("has no empty translations", () => {
    const empty = EN_PATHS.filter((path) => {
      const value = leafAt(dict, path);
      return typeof value === "string" && value.trim() === "";
    });

    expect(empty).toEqual([]);
  });

  it("preserves every interpolation placeholder", () => {
    const broken = EN_PATHS.filter((path) => {
      const source = leafAt(en as Dict, path);
      const target = leafAt(dict, path);
      if (typeof source !== "string" || typeof target !== "string") return false;
      return placeholders(source).join() !== placeholders(target).join();
    });

    expect(
      broken,
      `${locale} drops or renames {placeholders} — these render literally`,
    ).toEqual([]);
  });

  it("is not double-encoded UTF-8 (mojibake)", () => {
    const hits = EN_PATHS.filter((path) => {
      const value = leafAt(dict, path);
      return typeof value === "string" && looksLikeMojibake(value);
    });

    expect(
      hits,
      `${locale} still has nested UTF-8/Windows-1252 garbage`,
    ).toEqual([]);
  });
});

/**
 * UTF-8 bytes misread as Latin-1/CP1252 leave Ã, Â, or â€ sequences
 * (e.g. "Más" → "MÃ¡s" → "MÃÂ¡s"). These render as the homepage garbage
 * in the Spanish screenshot.
 */
function looksLikeMojibake(value: string): boolean {
  return /Ã.|Â[§°]|â€|\uFFFD/.test(value);
}

describe("es.json Spanish copy (homepage)", () => {
  const esDict = es as Dict;

  it("renders the hero headline with real accents", () => {
    expect(leafAt(esDict, "hero.headline")).toBe(
      "Cada Segundo Cuenta. Agiliza el Cumplimiento, Salva Más Vidas.",
    );
    expect(leafAt(esDict, "hero.cta_lost_pet")).toBe("Perdí una mascota");
    expect(leafAt(esDict, "hero.cta_crowdfunding")).toBe(
      "Emergencia: Recaudación de Fondos",
    );
    expect(leafAt(esDict, "hero.cta_surrender")).toBe(
      "Portal de Entrega Pública",
    );
  });

  it("keeps navigation and Daily Play in Spanish", () => {
    expect(leafAt(esDict, "nav.public_portal")).toBe("Portal Público");
    expect(leafAt(esDict, "nav.sign_in")).toBe("Iniciar sesión");
    expect(leafAt(esDict, "nav.fundraising")).toBe("Recaudación");
    expect(leafAt(esDict, "play.title")).toBe("¿Quién necesita un hogar?");
    expect(leafAt(esDict, "play.pace_calm")).toBe("Tardes tranquilas");
  });
});
