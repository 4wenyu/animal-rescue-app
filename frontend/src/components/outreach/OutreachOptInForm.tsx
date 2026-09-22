"use client";

/**
 * OutreachOptInForm — the citizen's "I can help" consent form for the
 * autonomous outreach agent (Tier 1.7).
 *
 * Honest framing: this is the explicit opt-in gate. Without it, the agent is
 * never allowed to contact anyone. On submit it creates/updates an
 * OutreachProfile and shows the one-click unsubscribe token.
 */

import { Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

import { OutreachContactFields } from "./OutreachContactFields";
import { OutreachHelpAreas } from "./OutreachHelpAreas";
import { OutreachOptInSuccess } from "./OutreachOptInSuccess";

export function OutreachOptInForm() {
  const { tr } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    unsubscribeToken: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const toggle = useCallback((value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (selected.length === 0) {
      setError(tr("outreach.error_none"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/outreach/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          helpAreas: selected,
          regionLabel: region.trim() || undefined,
          telegramChatId: telegramChatId.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; profile?: { unsubscribeToken?: string }; message?: string }
        | null;
      if (!res.ok || !json?.ok || !json.profile?.unsubscribeToken) {
        setError(json?.message ?? "Couldn't save your preferences right now.");
        return;
      }
      setResult({ unsubscribeToken: json.profile.unsubscribeToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your preferences.");
    } finally {
      setSaving(false);
    }
  }, [selected, region, telegramChatId, phone, tr]);

  const handleCopy = useCallback(async () => {
    if (!result?.unsubscribeToken) return;
    try {
      await navigator.clipboard.writeText(result.unsubscribeToken);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [result]);

  return (
    <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{tr("outreach.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {tr("outreach.body")}
          </p>
        </div>
      </div>

      <OutreachHelpAreas selected={selected} onToggle={toggle} tr={tr} />

      <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
        {tr("outreach.region_label")}
      </label>
      <input
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder={tr("outreach.region_placeholder")}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />

      <OutreachContactFields
        telegramChatId={telegramChatId}
        phone={phone}
        onTelegram={setTelegramChatId}
        onPhone={setPhone}
        tr={tr}
      />

      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}

      {!result ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? tr("outreach.saving") : tr("outreach.cta")}
        </button>
      ) : (
        <OutreachOptInSuccess
          token={result.unsubscribeToken}
          copied={copied}
          onCopy={handleCopy}
          tr={tr}
        />
      )}
    </div>
  );
}
