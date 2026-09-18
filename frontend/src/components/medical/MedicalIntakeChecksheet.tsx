"use client";
import { t as translate, resolveLocale, STORAGE_KEY } from "@/src/lib/useI18n";

import { type ReactNode, useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// TYPES — mirrors the Prisma MedicalLog model fields
// ---------------------------------------------------------------------------

export interface TprData {
  temperatureF: number | null;
  pulse: number | null;
  respiration: number | null;
}

export interface VaccineEntry {
  name: string;
  administeredAt: string; // ISO date string
}

export interface DewormerEntry {
  name: string;
  administeredAt: string; // ISO date string
}

/**
 * Known emergency triage symptoms — matching ASPCA/CART guidelines.
 *
 * Each sign has a stable i18n key under `medical.checksheet.emergency_sign.*`
 * which is used to render the localized label at runtime.
 */
export const EMERGENCY_SIGNS = [
  { key: "ulcers_in_mouth_or_nose" },
  { key: "vomiting" },
  { key: "diarrhea_bloody" },
  { key: "coughing" },
  { key: "patchy_hair_loss" },
  { key: "open_wounds_lacerations" },
  { key: "seizures" },
  { key: "difficulty_breathing" },
  { key: "limping_unable_to_bear_weight" },
  { key: "conjunctivitis_eye_discharge" },
] as const;

export type EmergencySignKey = (typeof EMERGENCY_SIGNS)[number]["key"];

export interface MedicalFormData {
  animalId: string;
  species: string;
  weightLbs: number | null;
  tpr: TprData;
  microchipScanned: boolean;
  vaccinesAdministered: VaccineEntry[];
  dewormerAdministered: DewormerEntry[];
  emergencySignsNoted: EmergencySignKey[];
}

// ---------------------------------------------------------------------------
// Synchronous i18n (6 locales + SSR-safe English fallbacks)
// ---------------------------------------------------------------------------





// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

export interface MedicalIntakeChecksheetProps {
  animalId: string;
  species: string;
  /** Optional locale. Falls back to localStorage-driven state. */
  locale?: string;
  /** Called with the assembled MedicalFormData on save. */
  onSave: (data: MedicalFormData) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function MedicalIntakeChecksheet({
  animalId,
  species,
  locale: localeProp,
  onSave,
}: MedicalIntakeChecksheetProps): ReactNode {
  // ── Core form state ─────────────────────────────────────────────────
  const [weightLbs, setWeightLbs] = useState<string>("");
  const [temp, setTemp] = useState<string>("");
  const [pulse, setPulse] = useState<string>("");
  const [respiration, setRespiration] = useState<string>("");

  const [microchipScanned, setMicrochipScanned] = useState(false);
  const [vaccinesGiven, setVaccinesGiven] = useState(false);
  const [dewormerGiven, setDewormerGiven] = useState(false);
  const [topspotApplied, setTopspotApplied] = useState(false);

  const [selectedSymptoms, setSelectedSymptoms] = useState<EmergencySignKey[]>([]);
  const [saved, setSaved] = useState(false);

  // Locale: prop preferred, but standalone usable too.
  const [fallbackLocale, setFallbackLocale] = useState("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setFallbackLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* default */
    }
    const handler = () => {
      try {
        setFallbackLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
      } catch {
        /* noop */
      }
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    return () =>
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
  }, []);
  const locale = localeProp ?? fallbackLocale;
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);

  // ── Derived ─────────────────────────────────────────────────────────
  const hasEmergencySigns = selectedSymptoms.length > 0;
  const isVetFlagged = hasEmergencySigns;

  // Helper: translate an emergency-sign key into the localized display string.
  const localizedSymptoms = selectedSymptoms.map((k) => t(`medical.checksheet.emergency_sign.${k}`));

  // ── Toggle an emergency sign ────────────────────────────────────────
  const toggleSymptom = useCallback((sign: EmergencySignKey) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign],
    );
  }, []);

  // ── Save handler ────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const data: MedicalFormData = {
      animalId,
      species,
      weightLbs: weightLbs ? parseFloat(weightLbs) : null,
      tpr: {
        temperatureF: temp ? parseFloat(temp) : null,
        pulse: pulse ? parseInt(pulse, 10) : null,
        respiration: respiration ? parseInt(respiration, 10) : null,
      },
      microchipScanned,
      vaccinesAdministered: vaccinesGiven
        ? [{ name: "DHPP (Distemper/Parvo)", administeredAt: new Date().toISOString() }]
        : [],
      dewormerAdministered: dewormerGiven
        ? [{ name: "Pyrantel Pamoate", administeredAt: new Date().toISOString() }]
        : [],
      emergencySignsNoted: selectedSymptoms,
    };

    // If topical flea/tick was applied, add it as a "vaccine" entry
    if (topspotApplied) {
      data.vaccinesAdministered.push({
        name: "Topspot flea/tick topical",
        administeredAt: new Date().toISOString(),
      });
    }

    void Promise.resolve(onSave(data)).then(
      () => setSaved(true),
      () => undefined,
    );
  }, [
    animalId,
    species,
    weightLbs,
    temp,
    pulse,
    respiration,
    microchipScanned,
    vaccinesGiven,
    dewormerGiven,
    topspotApplied,
    selectedSymptoms,
    onSave,
  ]);

  // ── Input helper ────────────────────────────────────────────────────
  const NumInput = ({
    labelKey,
    unitKey,
    value,
    onChange,
  }: {
    labelKey: string;
    unitKey: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex-1">
      <label className="mb-0.5 block text-xs font-medium text-neutral-600">
        {t(labelKey)}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-neutral-400">{t(unitKey)}</span>
      </div>
    </div>
  );

  // ── Confirmation view ───────────────────────────────────────────────
  if (saved) {
    return (
      <div className="space-y-4 rounded border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-3xl">&#x1F48A;</div>
        <h2 className="text-lg font-semibold text-green-800">
          {t("medical.checksheet.confirm_title")}
        </h2>

        {isVetFlagged && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>{t("medical.checksheet.vet_required")}</strong>
            <br />
            {t("medical.checksheet.vet_required_body", {
              signs: localizedSymptoms.join(", "),
            })}
          </div>
        )}

        <p className="text-sm text-green-700">
          {t("medical.checksheet.confirm_complete", { id: animalId, species })}
        </p>

        <button
          type="button"
          onClick={() => {
            setWeightLbs("");
            setTemp("");
            setPulse("");
            setRespiration("");
            setMicrochipScanned(false);
            setVaccinesGiven(false);
            setDewormerGiven(false);
            setTopspotApplied(false);
            setSelectedSymptoms([]);
            setSaved(false);
          }}
          className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          {t("medical.checksheet.new_exam")}
        </button>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          {t("medical.checksheet.title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("medical.checksheet.subtitle", { id: animalId, species })}
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        {/* ── Weight ────────────────────────────────────────── */}
        <div className="max-w-xs">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            {t("medical.checksheet.weight")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="e.g. 42.5"
              className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-neutral-400">
              {t("medical.checksheet.weight_unit")}
            </span>
          </div>
        </div>

        {/* ── TPR ───────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            {t("medical.checksheet.tpr_header")}
          </p>
          <div className="flex gap-4">
            <NumInput
              labelKey="medical.checksheet.tpr_temp"
              unitKey="medical.checksheet.unit_f"
              value={temp}
              onChange={setTemp}
            />
            <NumInput
              labelKey="medical.checksheet.tpr_pulse"
              unitKey="medical.checksheet.unit_bpm"
              value={pulse}
              onChange={setPulse}
            />
            <NumInput
              labelKey="medical.checksheet.tpr_resp"
              unitKey="medical.checksheet.unit_brpm"
              value={respiration}
              onChange={setRespiration}
            />
          </div>
        </div>

        {/* ── Toggle switches ───────────────────────────────── */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700">
            {t("medical.checksheet.procedures_header")}
          </legend>
          <div className="space-y-2">
            {([
              [
                microchipScanned,
                setMicrochipScanned,
                "medical.checksheet.procedure_microchip",
              ],
              [
                vaccinesGiven,
                setVaccinesGiven,
                "medical.checksheet.procedure_vaccines",
              ],
              [
                dewormerGiven,
                setDewormerGiven,
                "medical.checksheet.procedure_dewormer",
              ],
              [
                topspotApplied,
                setTopspotApplied,
                "medical.checksheet.procedure_topspot",
              ],
            ] as const).map(([checked, setter, labelKey]) => (
              <label
                key={labelKey}
                className="flex cursor-pointer items-center gap-3 rounded border border-neutral-100 bg-neutral-50 px-3 py-2 transition hover:border-blue-200"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setter(!checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700">{t(labelKey)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ── Emergency Signs ────────────────────────────────── */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700">
            {t("medical.checksheet.emergency_signs_header")}
            {isVetFlagged && (
              <span className="ml-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {t("medical.checksheet.vet_flagged")}
              </span>
            )}
          </legend>

          {isVetFlagged && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {t("medical.checksheet.detected_warning")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {EMERGENCY_SIGNS.map((sign) => (
              <label
                key={sign.key}
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
                  selectedSymptoms.includes(sign.key)
                    ? "bg-red-50 text-red-800"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(sign.key)}
                  onChange={() => toggleSymptom(sign.key)}
                  className="h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                />
                <span>{t(`medical.checksheet.emergency_sign.${sign.key}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ── Save ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("medical.checksheet.save_button")}
        </button>
      </div>
    </div>
  );
}
