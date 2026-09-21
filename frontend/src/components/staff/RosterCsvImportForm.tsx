"use client";

import { useState, type ChangeEvent } from "react";

import {
  ROSTER_CSV_TEMPLATE,
  type RosterCsvRow,
} from "@/lib/services/rosterCsvIngest";
import { RosterCsvPreviewTable } from "@/src/components/staff/RosterCsvPreviewTable";

type PreviewState = {
  rows: RosterCsvRow[];
  skipped: number;
};

export function RosterCsvImportForm() {
  const [csv, setCsv] = useState(ROSTER_CSV_TEMPLATE);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postCsv(dryRun: boolean) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const url = dryRun
        ? "/api/admin/roster-csv?dryRun=1"
        : "/api/admin/roster-csv";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: csv,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        upserted?: number;
        skipped?: number;
        rows?: RosterCsvRow[];
        message?: string;
      };
      if (!res.ok) {
        setError(json.message ?? "Request failed.");
        setPreview(null);
        return;
      }
      if (dryRun) {
        setPreview({ rows: json.rows ?? [], skipped: json.skipped ?? 0 });
        setMessage(
          `Preview: ${json.rows?.length ?? 0} valid row(s)` +
            (json.skipped ? `, ${json.skipped} skipped.` : "."),
        );
        return;
      }
      setPreview(null);
      setMessage(
        `Imported ${json.upserted ?? 0} animal(s)` +
          (json.skipped ? ` (${json.skipped} skipped).` : "."),
      );
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      setCsv(text);
      setPreview(null);
      setMessage(`Loaded ${file.name}. Run dry-run preview next.`);
      setError(null);
    });
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">
          Upload .csv (optional)
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-emerald-800"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">
          Pilot CSV (max 100 rows)
        </span>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={10}
          spellCheck={false}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </label>
      <p className="text-xs text-slate-500">
        Required: <code>id</code>, <code>name</code>. Optional: species, breed,
        age, sex, personality, imageUrl, holdCleared →{" "}
        <code>roster-&#123;id&#125;</code>.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void postCsv(true)}
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Working…" : "Dry-run preview"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void postCsv(false)}
          className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Working…" : "Import roster"}
        </button>
      </div>
      {message ? (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : null}
      {preview && preview.rows.length > 0 ? (
        <RosterCsvPreviewTable rows={preview.rows} />
      ) : null}
    </div>
  );
}
