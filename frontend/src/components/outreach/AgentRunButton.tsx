"use client";

/**
 * AgentRunButton — triggers the autonomous outreach agent's draft-generation
 * stage (POST /api/outreach/generate) and then refreshes the review queue.
 * STAFF/ADMIN only (the API enforces RBAC; the button is a convenience).
 */

import { Bot, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/src/lib/useI18n";

export function AgentRunButton() {
  const { tr } = useI18n();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    }
  }, [router]);

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={runAgent}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
        {running ? tr("outreach.agent_running") : tr("outreach.agent_run")}
        <RefreshCw className="h-3.5 w-3.5 opacity-60" />
      </button>
      {result && <p className="text-xs font-medium text-slate-500">{result}</p>}
    </div>
  );
}
