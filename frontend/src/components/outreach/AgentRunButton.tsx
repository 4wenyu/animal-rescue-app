"use client";

import { Bot, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/src/lib/useI18n";

type Preview = {
  optedIn: number;
  alreadyQueued: number;
  wouldCreate: number;
  eligibleAnimals: number;
};

export function AgentRunButton() {
  const { tr } = useI18n();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setResult(null);
    setConfirming(true);
    try {
      const res = await fetch("/api/outreach/generate", { credentials: "same-origin" });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; preview?: Preview; message?: string }
        | null;
      if (!res.ok || !json?.preview) {
        setResult(json?.message ?? "Could not preview the agent run.");
        setConfirming(false);
        return;
      }
      setPreview(json.preview);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Could not preview.");
      setConfirming(false);
    }
  }, []);

  const runAgent = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; created?: number; message?: string }
        | null;
      if (!res.ok || !json?.ok) {
        setResult(json?.message ?? "Agent run failed.");
      } else {
        setResult(
          json.created && json.created > 0
            ? `Generated ${json.created} draft${json.created === 1 ? "" : "s"} — review them below.`
            : "No new drafts (existing drafts are still open).",
        );
        router.refresh();
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Agent run failed.");
    } finally {
      setRunning(false);
      setConfirming(false);
      setPreview(null);
    }
  }, [router]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => void loadPreview()}
        disabled={running || confirming}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running || confirming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        {running ? tr("outreach.agent_running") : tr("outreach.agent_run")}
        <RefreshCw className="h-3.5 w-3.5 opacity-60" />
      </button>
      {preview && (
        <div className="max-w-xs rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-bold text-slate-900">
            {tr("outreach.agent_preview_title")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {tr("outreach.agent_preview_body", {
              drafts: preview.wouldCreate,
              animals: preview.eligibleAnimals,
            })}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setConfirming(false);
              }}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {tr("outreach.agent_preview_cancel")}
            </button>
            <button
              type="button"
              onClick={() => void runAgent()}
              disabled={running}
              className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              {tr("outreach.agent_preview_confirm")}
            </button>
          </div>
        </div>
      )}
      {result && <p className="text-xs font-medium text-slate-500">{result}</p>}
    </div>
  );
}
