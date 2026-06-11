"use client";

import { type ReactNode, useCallback, useState } from "react";

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

/** Known emergency triage symptoms — matching ASPCA/CART guidelines. */
export const EMERGENCY_SIGNS = [
  "Ulcers in mouth or nose",
  "Vomiting",
  "Diarrhea (bloody)",
  "Coughing",
  "Patchy hair loss",
  "Open wounds / lacerations",
  "Seizures",
  "Difficulty breathing",
  "Limping / unable to bear weight",
  "Conjunctivitis (eye discharge)",
] as const;

export type EmergencySign = (typeof EMERGENCY_SIGNS)[number];

export interface MedicalFormData {
  animalId: string;
  species: string;
  weightLbs: number | null;
  tpr: TprData;
  microchipScanned: boolean;
  vaccinesAdministered: VaccineEntry[];
  dewormerAdministered: DewormerEntry[];
  emergencySignsNoted: EmergencySign[];
}

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

export interface MedicalIntakeChecksheetProps {
  animalId: string;
  species: string;
  /** Called with the assembled MedicalFormData on save. */
  onSave: (data: MedicalFormData) => void;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function MedicalIntakeChecksheet({
  animalId,
  species,
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

  const [selectedSymptoms, setSelectedSymptoms] = useState<EmergencySign[]>(
    [],
  );
  const [saved, setSaved] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────
  const hasEmergencySigns = selectedSymptoms.length > 0;
  const isVetFlagged = hasEmergencySigns;

  // ── Toggle an emergency sign ────────────────────────────────────────
  const toggleSymptom = useCallback((sign: EmergencySign) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sign)
        ? prev.filter((s) => s !== sign)
        : [...prev, sign],
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

    onSave(data);
    setSaved(true);
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
    label,
    unit,
    value,
    onChange,
  }: {
    label: string;
    unit: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex-1">
      <label className="mb-0.5 block text-xs font-medium text-neutral-600">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-neutral-400">{unit}</span>
      </div>
    </div>
  );

  // ── Confirmation view ───────────────────────────────────────────────
  if (saved) {
    return (
      <div className="space-y-4 rounded border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-3xl">&#x1F48A;</div>
        <h2 className="text-lg font-semibold text-green-800">
          Medical Intake Recorded
        </h2>

        {isVetFlagged && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>&#x26A0;&#xFE0F; Veterinary Notification Required</strong>
            <br />
            Emergency signs detected: {selectedSymptoms.join(", ")}. A
            veterinarian has been flagged for immediate review.
          </div>
        )}

        <p className="text-sm text-green-700">
          Animal <strong>{animalId}</strong> ({species}) medical check
          complete.
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
          New Exam
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
          Medical Intake Checksheet
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          ASPCA / CART-aligned brief intake exam &mdash; Animal ID:{" "}
          <strong>{animalId}</strong> &middot; Species:{" "}
          <strong>{species}</strong>
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        {/* ── Weight ────────────────────────────────────────── */}
        <div className="max-w-xs">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Weight
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
            <span className="text-sm text-neutral-400">lbs</span>
          </div>
        </div>

        {/* ── TPR ───────────────────────────────────────────── */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700">
            TPR (Temperature, Pulse, Respiration)
          </p>
          <div className="flex gap-4">
            <NumInput
              label="Temperature"
              unit="°F"
              value={temp}
              onChange={setTemp}
            />
            <NumInput
              label="Pulse"
              unit="bpm"
              value={pulse}
              onChange={setPulse}
            />
            <NumInput
              label="Respiration"
              unit="brpm"
              value={respiration}
              onChange={setRespiration}
            />
          </div>
        </div>

        {/* ── Toggle switches ───────────────────────────────── */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700">
            Intake Procedures
          </legend>
          <div className="space-y-2">
            {([
              [microchipScanned, setMicrochipScanned, "Microchip Scanned"],
              [vaccinesGiven, setVaccinesGiven, "Vaccines Administered"],
              [dewormerGiven, setDewormerGiven, "Dewormer Administered"],
              [topspotApplied, setTopspotApplied, "Topspot flea/tick applied"],
            ] as const).map(([checked, setter, label]) => (
              <label
                key={label}
                className="flex cursor-pointer items-center gap-3 rounded border border-neutral-100 bg-neutral-50 px-3 py-2 transition hover:border-blue-200"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setter(!checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ── Emergency Signs ────────────────────────────────── */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-700">
            Emergency Signs
            {isVetFlagged && (
              <span className="ml-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                VET FLAGGED
              </span>
            )}
          </legend>

          {isVetFlagged && (
            <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              &#x26A0;&#xFE0F; Emergency signs detected — a veterinarian
              will be notified upon save.
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {EMERGENCY_SIGNS.map((sign) => (
              <label
                key={sign}
                className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
                  selectedSymptoms.includes(sign)
                    ? "bg-red-50 text-red-800"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(sign)}
                  onChange={() => toggleSymptom(sign)}
                  className="h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                />
                <span>{sign}</span>
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
          Save Medical Intake Record
        </button>
      </div>
    </div>
  );
}