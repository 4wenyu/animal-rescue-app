"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileText,
  Info,
  Loader2,
  PawPrint,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Synchronous i18n (6 locales + SSR-safe English fallbacks)
// ---------------------------------------------------------------------------

import enDict from "../../../locales/en.json";
import esDict from "../../../locales/es.json";
import zhCNDict from "../../../locales/zh-CN.json";
import zhTWDict from "../../../locales/zh-TW.json";
import jaDict from "../../../locales/ja.json";
import koDict from "../../../locales/ko.json";
import zhLegacyDict from "../../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
  zh: zhLegacyDict as unknown as Record<string, unknown>,
};
const STORAGE_KEY = "rescuehub_locale";

function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN";
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

const EN_FALLBACK: Record<string, string> = {
  "document_scan.title": "AI Intake — Batch Document Upload",
  "document_scan.description":
    "Drop cage cards or intake sheets (images / PDFs) below. The Gemini model will extract structured intake records.",
  "document_scan.dropzone_headline":
    "Drag & drop files here, or click to browse",
  "document_scan.dropzone_caption":
    "JPEG, PNG, WEBP, HEIC, or PDF — multiple files allowed",
  "document_scan.aria_dropzone": "AI Intake Batch Upload",
  "document_scan.error_invalid_type":
    "Only images (JPEG, PNG, WEBP, HEIC) and PDFs are accepted.",
  "document_scan.error_unknown": "Unknown upload error.",
  "document_scan.staged_files": "Staged files ({count})",
  "document_scan.clear_all": "Clear all",
  "document_scan.remove_file": "Remove {name}",
  "document_scan.size_kb": "{kb} KB",
  "document_scan.run_extraction": "Run AI Intake Extraction",
  "document_scan.analyzing": "Analyzing documents with AI…",
  "document_scan.rate_limit_note":
    "Sequential processing keeps us under the API rate limit (~2 sec per file).",
  "document_scan.results_heading": "Extracted Records ({count})",
  "document_scan.results_aria": "Extraction results",
  "document_scan.empty_results_title":
    "No intake records detected in these documents.",
  "document_scan.empty_results_body":
    "The AI scanned your files successfully but could not find any readable intake records. Try uploading sharper images, ensure the cage card text is legible, or pick a different document.",
  "document_scan.empty_results_dismiss": "Dismiss",
  "document_scan.pre_submission_hint":
    "No extractions yet. Stage some files above to get started.",
  // AnimalCard subcomponent
  "document_scan.unnamed_animal": "Unnamed animal #{n}",
  "document_scan.unknown_species": "unknown species",
  "document_scan.age_unknown": "Age unknown",
  "document_scan.age_yr": "{n} yr",
  "document_scan.field_species": "Species",
  "document_scan.field_breed": "Breed",
  "document_scan.field_age": "Age",
  "document_scan.field_sex": "Sex",
  "document_scan.field_medical": "Medical",
  "document_scan.field_hold_cleared": "Hold Cleared",
  "document_scan.yes": "Yes",
  "document_scan.no": "No",
  "document_scan.intake_notes": "Intake Notes",
  "document_scan.intake_number": "Intake #{n}",
};

function trFor(locale: string, key: string, vars?: Record<string, string | number>): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) return EN_FALLBACK[key] ?? key;
    value = (value as Record<string, unknown>)[p];
  }
  if (typeof value !== "string") return EN_FALLBACK[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    value,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One extracted animal record returned by the AI intake endpoint.
 * Mirrors the Zod schema at lib/schemas/intake.ts (PetIntakeSchema).
 * All fields are optional because the AI may leave any of them null when
 * the source image doesn't carry that information.
 */
export interface ExtractedAnimal {
  name?: string | null;
  species?: "dog" | "cat" | "rabbit" | "other" | null;
  breed?: string | null;
  age?: number | null;
  sex?: "male" | "female" | "unknown" | null;
  weightLbs?: number | null;
  medicalStatus?:
    | "Healthy"
    | "Needs Review"
    | "Treatable"
    | "Urgent"
    | "Untreatable"
    | null;
  euthanasia_risk_status?: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL" | null;
  statutoryHoldCleared?: boolean | null;
  intakeTimestamp?: string | null;
  intakeNumber?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface BatchUploadProps {
  /** Override the API endpoint (defaults to /api/shelter/intake/map). */
  endpoint?: string;
  /** Called once after each successful submission with all extracted records. */
  onComplete?: (animals: ExtractedAnimal[]) => void;
  /**
   * Optional override for the header title.
   * When omitted, falls back to `document_scan.title`.
   */
  title?: string;
  /**
   * Optional override for the header description.
   * When omitted, falls back to `document_scan.description`.
   */
  description?: string;
  /**
   * Optional locale override. When omitted, the component resolves the
   * active locale from localStorage and listens for the
   * `rescuehub-locale-change` event.
   */
  locale?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchUpload({
  endpoint = "/api/shelter/intake/map",
  onComplete,
  title,
  description,
  locale: localeProp,
}: BatchUploadProps): ReactNode {
  // ── State ────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtractedAnimal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAttemptedSubmission, setHasAttemptedSubmission] = useState(false);
  const [fallbackLocale, setFallbackLocale] = useState("en");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Locale: prop preferred, otherwise localStorage + event listener.
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
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      trFor(locale, key, vars),
    [locale],
  );

  const headerTitle = title ?? t("document_scan.title");
  const headerDescription = description ?? t("document_scan.description");

  // ── File selection helpers ───────────────────────────────────────────
  const ACCEPTED_MIME = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ];
  const ACCEPTED_ATTR = ACCEPTED_MIME.join(",");

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const filtered = arr.filter(
        (f) =>
          ACCEPTED_MIME.includes(f.type) ||
          /.(jpe?g|png|webp|heic|pdf)$/i.test(f.name),
      );
      if (filtered.length === 0) {
        setError(t("document_scan.error_invalid_type"));
        return;
      }
      setError(null);
      setFiles((prev) => [...prev, ...filtered]);
    },
    [t],
  );

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    setHasAttemptedSubmission(false);
  }, []);

  // ── Drag & drop handlers ─────────────────────────────────────────────
  const handleDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  // ── Submit handler ───────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (files.length === 0 || isLoading) return;
    setIsLoading(true);
    setError(null);

    let succeededCleanly = false;
    const accumulated: ExtractedAnimal[] = [];

    try {
      setHasAttemptedSubmission(true);
      for (const file of files) {
        try {
          const formData = new FormData();
          formData.append("files", file, file.name);

          const res = await fetch(endpoint, { method: "POST", body: formData });

          if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(
              `Upload failed (${res.status}) on "${file.name}": ${text.slice(0, 240) || res.statusText}`,
            );
          }

          const json = (await res.json()) as { animals?: ExtractedAnimal[] };
          if (Array.isArray(json.animals)) {
            accumulated.push(...json.animals);
          }
        } finally {
          setFiles((prev) => prev.filter((f) => f !== file));
        }

        if (files.indexOf(file) < files.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setResults(accumulated);
      onComplete?.(accumulated);
      succeededCleanly = true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("document_scan.error_unknown");
      setError(message);
      if (accumulated.length > 0) {
        setResults(accumulated);
        onComplete?.(accumulated);
      }
    } finally {
      setIsLoading(false);
      if (succeededCleanly) {
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  }, [files, isLoading, endpoint, onComplete, t]);

  const canSubmit = files.length > 0 && !isLoading;

  return (
    <section
      aria-label={t("document_scan.aria_dropzone")}
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6"
    >
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-rose-600" aria-hidden />
          {headerTitle}
        </h1>
        <p className="text-sm text-slate-600">{headerDescription}</p>
      </header>

      {/* Drop zone */}
      <label
        htmlFor="batch-upload-input"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer select-none",
          isDragging
            ? "border-rose-500 bg-rose-50"
            : "border-slate-300 bg-slate-50 hover:border-rose-400 hover:bg-rose-50/50",
          isLoading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <UploadCloud
          className={`h-10 w-10 ${isDragging ? "text-rose-600" : "text-slate-400"}`}
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-800">
            {t("document_scan.dropzone_headline")}
          </p>
          <p className="text-xs text-slate-500">
            {t("document_scan.dropzone_caption")}
          </p>
        </div>
        <input
          ref={fileInputRef}
          id="batch-upload-input"
          type="file"
          multiple
          accept={ACCEPTED_ATTR}
          onChange={handleFileInputChange}
          disabled={isLoading}
          className="sr-only"
        />
      </label>

      {/* Staged files list */}
      {files.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">
              {t("document_scan.staged_files", { count: files.length })}
            </h2>
            {!isLoading && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t("document_scan.clear_all")}
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-100">
            {files.map((file, idx) => (
              <li
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {file.type === "application/pdf" ? (
                    <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : (
                    <FileImage className="h-4 w-4 text-sky-500 shrink-0" />
                  )}
                  <span className="truncate text-slate-800">{file.name}</span>
                  <span className="text-xs text-slate-400 shrink-0">
                    {t("document_scan.size_kb", {
                      kb: Math.round(file.size / 1024),
                    })}
                  </span>
                </span>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={t("document_scan.remove_file", { name: file.name })}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all",
            canSubmit
              ? "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              : "bg-slate-200 text-slate-400 cursor-not-allowed",
          ].join(" ")}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("document_scan.analyzing")}
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" aria-hidden />
              {t("document_scan.run_extraction")}
            </>
          )}
        </button>
        {isLoading && (
          <p className="text-xs text-slate-500">
            {t("document_scan.rate_limit_note")}
          </p>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <section
          aria-label={t("document_scan.results_aria")}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900">
              {t("document_scan.results_heading", { count: results.length })}
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((animal, idx) => (
              <AnimalCard
                key={animal.intakeNumber ?? idx}
                animal={animal}
                index={idx}
                t={t}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Empty-results notice (post-submission only) */}
      {!isLoading &&
        hasAttemptedSubmission &&
        results.length === 0 &&
        files.length === 0 &&
        !error && (
          <div
            role="status"
            aria-live="polite"
            data-testid="empty-results-alert"
            className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm"
          >
            <Info
              className="h-5 w-5 shrink-0 mt-0.5 text-amber-600"
              aria-hidden
            />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                {t("document_scan.empty_results_title")}
              </p>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                {t("document_scan.empty_results_body")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasAttemptedSubmission(false)}
              aria-label={t("document_scan.empty_results_dismiss")}
              className="text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* Pre-submission hint */}
      {!isLoading &&
        !hasAttemptedSubmission &&
        results.length === 0 &&
        files.length === 0 &&
        !error && (
          <p className="text-center text-xs text-slate-400 pt-2">
            {t("document_scan.pre_submission_hint")}
          </p>
        )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: extracted animal card
// ---------------------------------------------------------------------------

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

function AnimalCard({
  animal,
  index,
  t,
}: {
  animal: ExtractedAnimal;
  index: number;
  t: TranslateFn;
}): ReactNode {
  const name = animal.name ?? t("document_scan.unnamed_animal", { n: index + 1 });
  const species = animal.species ?? t("document_scan.unknown_species");
  const breed = animal.breed ?? "—";
  const ageRaw = animal.age;
  const age =
    typeof ageRaw === "number"
      ? t("document_scan.age_yr", { n: ageRaw })
      : t("document_scan.age_unknown");

  const risk = animal.euthanasia_risk_status ?? null;
  const riskStyles =
    risk === "IMMEDIATE_BEHAVIORAL"
      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
      : risk === "AT_RISK"
        ? "bg-orange-100 text-orange-900 ring-1 ring-orange-300"
        : risk === "SAFE"
          ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300"
          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <header className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 capitalize">{name}</h3>
        {risk && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${riskStyles}`}
          >
            {risk.replace("_", " ")}
          </span>
        )}
      </header>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Field label={t("document_scan.field_species")} value={species} />
        <Field label={t("document_scan.field_breed")} value={breed} />
        <Field label={t("document_scan.field_age")} value={age} />
        <Field
          label={t("document_scan.field_sex")}
          value={
            typeof animal.sex === "string" && animal.sex.length > 0
              ? animal.sex
              : "—"
          }
        />
        <Field
          label={t("document_scan.field_medical")}
          value={
            typeof animal.medicalStatus === "string" && animal.medicalStatus.length > 0
              ? animal.medicalStatus
              : "—"
          }
        />
        <Field
          label={t("document_scan.field_hold_cleared")}
          value={
            typeof animal.statutoryHoldCleared === "boolean"
              ? animal.statutoryHoldCleared
                ? t("document_scan.yes")
                : t("document_scan.no")
              : "—"
          }
        />
      </dl>

      {animal.notes && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1">
            {t("document_scan.intake_notes")}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {animal.notes}
          </p>
        </div>
      )}

      {animal.intakeNumber && (
        <p className="mt-3 text-[11px] text-slate-400 font-mono">
          {t("document_scan.intake_number", { n: animal.intakeNumber })}
        </p>
      )}
    </li>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactNode {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
        {label}
      </dt>
      <dd className="text-sm text-slate-800 capitalize">{value}</dd>
    </div>
  );
}

export default BatchUpload;
