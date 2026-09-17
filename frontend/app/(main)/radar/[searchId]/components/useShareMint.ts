"use client";

/**
 * useShareMint — mints a search-scoped share link and tracks the copy UX.
 *
 * `platformPostId` needs ≥12 chars; a random UUID satisfies it and is
 * globally unique (the column is UNIQUE). Clipboard writes fall back to
 * selecting the tracking URL text when the clipboard is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { trWithFallback } from "./i18nFallback";
import type { TrFn } from "./types";

export function useShareMint(searchId: string, tr: TrFn) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const createLink = useCallback(
    async (onMinted: () => void | Promise<void>) => {
      if (creating) return;
      setCreating(true);
      setError(null);
      try {
        const platformPostId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2).padEnd(12, "x")}`;
        const res = await fetch("/api/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            platform: "GENERIC_LINK",
            platformPostId,
            relatedSearchId: searchId,
            evidenceSnapshot: { source: "radar-share-to-earn" },
          }),
        });
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; trackingUrl?: string; message?: string }
          | null;
        if (!res.ok || !json?.ok || !json.trackingUrl) {
          setError(
            json?.message ?? trWithFallback(tr, "radar.share_error_create"),
          );
          return;
        }
        setTrackingUrl(json.trackingUrl);
        await onMinted();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : trWithFallback(tr, "radar.share_error_generic"),
        );
      } finally {
        setCreating(false);
      }
    },
    [creating, searchId, tr],
  );

  const copy = useCallback(async () => {
    if (!trackingUrl) return;
    try {
      await navigator.clipboard.writeText(trackingUrl);
    } catch {
      // Clipboard may be unavailable in some contexts; fall back to
      // selecting the text.
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        const node = document.getElementById("share-track-url");
        if (sel && node) {
          range.selectNodeContents(node);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch {
        /* ignore */
      }
    }
    setCopied(true);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [trackingUrl]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  return { creating, error, trackingUrl, copied, createLink, copy };
}
