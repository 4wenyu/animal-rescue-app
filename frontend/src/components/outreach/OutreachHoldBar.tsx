"use client";

import { Check, Loader2, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HOLD_MS = 30_000;

export function OutreachHoldBar({
  reviewedAt,
  busy,
  onSendNow,
  onUndo,
  t,
}: {
  reviewedAt: string | null;
  busy: boolean;
  onSendNow: () => void;
  onUndo: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [left, setLeft] = useState(() => remainingSeconds(reviewedAt));
  const sent = useRef(false);

  useEffect(() => {
    sent.current = false;
    setLeft(remainingSeconds(reviewedAt));
    const id = window.setInterval(() => {
      setLeft(remainingSeconds(reviewedAt));
    }, 250);
    return () => window.clearInterval(id);
  }, [reviewedAt]);

  useEffect(() => {
    if (left !== 0 || busy || sent.current || !reviewedAt) return;
    sent.current = true;
    onSendNow();
    // Fire once when the window closes — parent no-ops if already sending.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, busy, reviewedAt]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold text-amber-800">
        {t("outreach.hold_sending_in", { s: left })}
      </p>
      <button
        type="button"
        onClick={onSendNow}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {t("outreach.hold_send_now")}
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        <Undo2 className="h-3.5 w-3.5" />
        {t("outreach.hold_undo")}
      </button>
    </div>
  );
}

function remainingSeconds(reviewedAt: string | null): number {
  if (!reviewedAt) return 0;
  const elapsed = Date.now() - new Date(reviewedAt).getTime();
  return Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000));
}
