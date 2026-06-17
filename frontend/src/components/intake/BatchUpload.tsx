"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  useCallback,
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

// `hasAttemptedSubmission` distinguishes "user hasn't tried yet, fresh slate"
// from "user submitted and we got back 0 records, queue finished." Without
// this, the empty-results yellow alert would flash on initial page load.

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
  /** Optional caption shown above the drop zone. */
  title?: string;
  /** Optional helper text shown beneath the drop zone title. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchUpload({
  endpoint = "/api/shelter/intake/map",
  onComplete,
  title = "AI Intake — Batch Document Upload",
  description = "Drop cage cards or intake sheets (images / PDFs) below. The Gemini model will extract structured intake records.",
}: BatchUploadProps): ReactNode {
  // ── State ────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ExtractedAnimal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Flips true the first time the user hits submit. Used to gate the
  // empty-results yellow alert so it only appears AFTER a real run
  // (never on initial page load when `results.length === 0` is the
  // expected "haven't tried yet" state).
  const [hasAttemptedSubmission, setHasAttemptedSubmission] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const filtered = arr.filter(
      (f) =>
        ACCEPTED_MIME.includes(f.type) ||
        // Some browsers leave file.type empty for PDFs; fall back to extension.
        /\.(jpe?g|png|webp|heic|pdf)$/i.test(f.name),
    );
    if (filtered.length === 0) {
      setError("Only images (JPEG, PNG, WEBP, HEIC) and PDFs are accepted.");
      return;
    }
    setError(null);
    setFiles((prev) => [...prev, ...filtered]);
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setResults([]);
    setError(null);
    // Also reset the submission flag so the green/yellow banners go away
    // and the user sees the fresh "stage some files" state again.
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
        // Reset so re-selecting the same file fires onChange again.
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

    // Use an exit flag so the finally block can distinguish a clean run
    // from one where every file failed before any records were committed.
    let succeededCleanly = false;
    const accumulated: ExtractedAnimal[] = [];

    try {
      // Mark that we've attempted at least one submission. This drives
      // the yellow "0 records" alert rendering below.
      setHasAttemptedSubmission(true);
      for (const file of files) {
        // Per-file isolation: one bad upload must NOT poison the rest
        // of the queue, leave the spinner stuck, or hide already-completed
        // extractions. Each iteration pushes into `accumulated` directly,
        // and failures throw out of this try block.
        try {
          const formData = new FormData();
          // Field name MUST be "files" (plural) — the route does
          // formData.getAll("files") and iterates each entry.
          formData.append("files", file, file.name);

          const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

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
          // ALWAYS remove the processed file from staging so the queue UI
          // reflects ground truth, even if this specific file threw.
          setFiles((prev) => prev.filter((f) => f !== file));
        }

        // 2-second rate-limit safety delay per file (mirrors route-side delay).
        // Skip the delay after the last file so success lands instantly.
        if (files.indexOf(file) < files.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Loop completed end-to-end: commit accumulated results to state.
      setResults(accumulated);
      onComplete?.(accumulated);
      succeededCleanly = true;
    } catch (err) {
      // A single file failed. Show the error AND surface whatever partial
      // records were extracted from the files that succeeded before it.
      const message =
        err instanceof Error ? err.message : "Unknown upload error.";
      setError(message);
      if (accumulated.length > 0) {
        setResults(accumulated);
        onComplete?.(accumulated);
      }
    } finally {
      // Bulletproof reset — runs on every exit path (success, per-failure,
      // and total crash). This is the contract that prevents the spinner
      // from getting stuck.
      setIsLoading(false);

      // Clear staging on a clean full-pass success. (Per-file cleanup
      // already happens in the inner finally above.)
      if (succeededCleanly) {
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  }, [files, isLoading, endpoint, onComplete]);

  // ── Render ───────────────────────────────────────────────────────────
  const canSubmit = files.length > 0 && !isLoading;

  return (
    <section
      aria-label="AI Intake Batch Upload"
      className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6"
    >
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <PawPrint className="h-6 w-6 text-rose-600" aria-hidden />
          {title}
        </h1>
        <p className="text-sm text-slate-600">{description}</p>
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
            Drag & drop files here, or click to browse
          </p>
          <p className="text-xs text-slate-500">
            JPEG, PNG, WEBP, HEIC, or PDF — multiple files allowed
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
              Staged files ({files.length})
            </h2>
            {!isLoading && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Clear all
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
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                {!isLoading && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label={`Remove ${file.name}`}
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
              Analyzing documents with AI…
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" aria-hidden />
              Run AI Intake Extraction
            </>
          )}
        </button>
        {isLoading && (
          <p className="text-xs text-slate-500">
            Sequential processing keeps us under the API rate limit (~2 sec per file).
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
        <section aria-label="Extraction results" className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-900">
              Extracted Records ({results.length})
            </h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((animal, idx) => (
              <AnimalCard key={animal.intakeNumber ?? idx} animal={animal} index={idx} />
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
                No intake records detected in these documents.
              </p>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                The AI scanned your files successfully but could not find any
                readable intake records. Try uploading sharper images, ensure
                the cage card text is legible, or pick a different document.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasAttemptedSubmission(false)}
              aria-label="Dismiss"
              className="text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

      {/* Pre-submission hint (only when nothing has been done yet) */}
      {!isLoading &&
        !hasAttemptedSubmission &&
        results.length === 0 &&
        files.length === 0 &&
        !error && (
          <p className="text-center text-xs text-slate-400 pt-2">
            No extractions yet. Stage some files above to get started.
          </p>
        )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Subcomponent: extracted animal card
// ---------------------------------------------------------------------------

function AnimalCard({
  animal,
  index,
}: {
  animal: ExtractedAnimal;
  index: number;
}): ReactNode {
  const name = animal.name ?? `Unnamed animal #${index + 1}`;
  const species = animal.species ?? "unknown species";
  const breed = animal.breed ?? "—";
  const ageRaw = animal.age;
  const age = typeof ageRaw === "number" ? `${ageRaw} yr` : "Age unknown";

  // Compliance: highlight IMMEDIATE_BEHAVIORAL so staff visually catch it.
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
        <Field label="Species" value={species} />
        <Field label="Breed" value={breed} />
        <Field label="Age" value={age} />
        <Field
          label="Sex"
          value={
            typeof animal.sex === "string" && animal.sex.length > 0
              ? animal.sex
              : "—"
          }
        />
        <Field
          label="Medical"
          value={
            typeof animal.medicalStatus === "string" && animal.medicalStatus.length > 0
              ? animal.medicalStatus
              : "—"
          }
        />
        <Field
          label="Hold Cleared"
          value={
            typeof animal.statutoryHoldCleared === "boolean"
              ? animal.statutoryHoldCleared
                ? "Yes"
                : "No"
              : "—"
          }
        />
      </dl>

      {animal.notes && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-1">
            Intake Notes
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {animal.notes}
          </p>
        </div>
      )}

      {animal.intakeNumber && (
        <p className="mt-3 text-[11px] text-slate-400 font-mono">
          Intake #{animal.intakeNumber}
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
