"use client";

import { useEffect, useState } from "react";
import { PawPrint, Tag } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";
import {
  breedsForSpecies,
  speciesForLocale,
  type LocaleCode,
  type SpeciesCode,
} from "@/src/lib/animalTaxonomy";

/**
 * SpeciesBreedSelect — localized, accessible species + breed pickers.
 *
 * Backed by `src/lib/animalTaxonomy.ts` (7-language species names; breed names
 * kept as proper nouns with translated descriptive types). Uses native
 * <select> elements so keyboard + screen-reader support is free; styling is
 * Tailwind-only (project rule: no inline CSS).
 *
 * Contract:
 *   - `value.species` / `value.breed` are the currently selected codes.
 *   - `onChange` fires with both fields whenever either picker changes;
 *     choosing a species resets a now-inapplicable breed to null.
 */

export interface SpeciesBreedValue {
  species: SpeciesCode | null;
  breed: string | null;
}

export interface SpeciesBreedSelectProps {
  value: SpeciesBreedValue;
  onChange: (next: SpeciesBreedValue) => void;
  disabled?: boolean;
}

const PLACEHOLDERS: Record<LocaleCode, { species: string; breed: string }> = {
  en: { species: "Select species…", breed: "Select breed…" },
  es: { species: "Seleccionar especie…", breed: "Seleccionar raza…" },
  "zh-CN": { species: "选择物种…", breed: "选择品种…" },
  "zh-TW": { species: "選擇物種…", breed: "選擇品種…" },
  ja: { species: "種別を選択…", breed: "品種を選択…" },
  ko: { species: "종 선택…", breed: "품종 선택…" },
};

const selectClass =
  "w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-sm font-medium text-slate-800 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60";

export function SpeciesBreedSelect({
  value,
  onChange,
  disabled = false,
}: SpeciesBreedSelectProps) {
  const { locale } = useI18n();
  const [species, setSpecies] = useState<SpeciesCode | null>(value.species);
  const [breed, setBreed] = useState<string | null>(value.breed);

  // Sync when the parent supplies a new value (e.g. AI-extracted intake).
  useEffect(() => {
    setSpecies(value.species);
    setBreed(value.breed);
  }, [value.species, value.breed]);

  const ph = PLACEHOLDERS[locale] ?? PLACEHOLDERS.en;
  const speciesOptions = speciesForLocale(locale);
  const breedOptions = species ? breedsForSpecies(species, locale) : [];

  const handleSpecies = (code: string) => {
    const nextSpecies = (code || null) as SpeciesCode | null;
    setSpecies(nextSpecies);
    setBreed(null);
    onChange({ species: nextSpecies, breed: null });
  };

  const handleBreed = (code: string) => {
    const nextBreed = code || null;
    setBreed(nextBreed);
    onChange({ species, breed: nextBreed });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="relative">
        <PawPrint className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={species ?? ""}
          onChange={(e) => handleSpecies(e.target.value)}
          disabled={disabled}
          aria-label={ph.species}
          className={selectClass}
        >
          <option value="">{ph.species}</option>
          {speciesOptions.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={breed ?? ""}
          onChange={(e) => handleBreed(e.target.value)}
          disabled={disabled || !species}
          aria-label={ph.breed}
          className={selectClass}
        >
          <option value="">
            {species ? ph.breed : ph.species}
          </option>
          {breedOptions.map((b) => (
            <option key={b.code} value={b.code}>
              {b.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
