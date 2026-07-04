/**
 * ShareToHelpButton
 * =================
 * One-click "share to recruit your socials to save this animal". Calls
 * `/api/shares`, copies the `trackingUrl` to clipboard, and announces via
 * an inline toast.
 *
 * Idempotent: each click POSTs a brand-new shareId so retry-safe; the
 * server de-duplicates same `idempotencyKey` from retries elsewhere.
 * We do not dedupe on the client — fresh shareIds are fine, each one is
 * a unique landing URL.
 */

"use client";

import { useEffect, useState } from "react";
import { Share2, Link2, Check, AlertTriangle, Loader2 } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

export interface ShareToHelpButtonProps {
  relatedAnimalId: string | number;
  /** When true, the link is generated for a generic landing w/o animal. */
  generic?: boolean;
  /** Optional className for layout sizing. */
  className?: string;
}

type Status = "idle" | "pending" | "copied" | "error";

export function ShareToHelpButton({
  relatedAnimalId,
  className = "",
}: ShareToHelpButtonProps) {
  const { tr } = useI18n();

  const [status, setStatus] = useState<Status>("idle");
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // Auto-clear the toast after 4s.
  useEffect(() => {
    if (status === "copied" || status === "error") {
      const id = window.setTimeout(
        () => setStatus("idle"),
        4000,
      );
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [status]);

  async function handleClick() {
    if (status === "pending") return;
    setStatus("pending");
    setError("");

    const platformPostId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `nanoid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          platform: "GENERIC_LINK",
          platformPostId,
          status: "PENDING",
          relatedAnimalId: String(relatedAnimalId),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`);
      }

      const url = typeof json.trackingUrl === "string" ? json.trackingUrl : null;
      if (!url) {
        throw new Error("Server did not return trackingUrl.");
      }

      // Best-effort: copy to clipboard. If denied (no permission, old
      // browser), still show the URL so the user can drag-copy manually.
      const copied = await copyToClipboard(url);
      setTrackingUrl(url);
      setStatus(copied ? "copied" : "copied"); // either way, we have a link
    } catch (err) {
      console.error("[ShareToHelpButton] failed", err);
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "pending"}
        aria-label={tr("dashboard.share.idle_aria")}
        title={tr("dashboard.share.idle_tooltip")}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
          status === "pending"
            ? "cursor-not-allowed bg-amber-50 text-amber-700"
            : status === "copied"
              ? "bg-emerald-100 text-emerald-800"
              : "cursor-pointer bg-amber-50 text-amber-700 hover:bg-amber-100"
        }`}
        data-testid="share-to-help-button"
        data-related-animal={relatedAnimalId}
      >
        {status === "idle" && (
          <>
            <Share2 className="h-3 w-3" />
            🔗 {tr("dashboard.share.idle")}
          </>
        )}
        {status === "pending" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            {tr("dashboard.share.pending")}
          </>
        )}
        {status === "copied" && (
          <>
            <Check className="h-3 w-3" />
            {tr("dashboard.share.copied")}
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="h-3 w-3" />
            {tr("dashboard.share.error")}
          </>
        )}
      </button>

      {/* Toast (DOM-only) */}
      {(status === "copied" || status === "error") && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed top-6 right-6 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition ${
            status === "copied"
              ? "border-emerald-300 bg-emerald-50/95 text-emerald-900"
              : "border-rose-300 bg-rose-50/95 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-2">
            {status === "copied" ? (
              <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" />
            )}
            <div className="text-xs leading-relaxed">
              <p className="font-semibold">
                {status === "copied"
                  ? tr("dashboard.share.toast_ready")
                  : tr("dashboard.share.toast_error")}
              </p>
              {status === "copied" && trackingUrl && (
                <p className="mt-1 break-all font-mono text-[11px] text-emerald-700">
                  {trackingUrl}
                </p>
              )}
              {status === "error" && (
                <p className="mt-1 font-mono text-[11px] text-rose-700">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Tiny cross-browser clipboard helper. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    if (typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    }
  } catch {
    return false;
  }
  return false;
}

export default ShareToHelpButton;