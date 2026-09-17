/**
 * useRadarSearch — data hook for /radar/[searchId].
 *
 * Owns the search-row fetch (GET /api/searches?searchId=…) and the status
 * patch (PATCH /api/searches/[searchId]). Pure data — presentation lives
 * in the sibling components. `setStatus` resolves to the updated row (or
 * null when the patch failed) so the caller can react, e.g. appending the
 * closing line to the activity feed.
 */

import { useCallback, useEffect, useState } from "react";

import type { SearchDto } from "./types";

interface SearchApiResponse {
  ok: boolean;
  search?: SearchDto;
  message?: string;
}

export function useRadarSearch(searchId: string) {
  const [search, setSearch] = useState<SearchDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);

  /* ── Fetch the search row ──────────────────────────────────────────── */
  useEffect(() => {
    if (!searchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/searches?searchId=${encodeURIComponent(searchId)}`,
          { method: "GET", credentials: "same-origin" },
        );
        const json = (await res.json().catch(() => null)) as
          | SearchApiResponse
          | null;
        if (cancelled) return;
        if (!res.ok || !json?.ok || !json.search) {
          setLoadError(
            json?.message ?? `Could not load search (HTTP ${res.status}).`,
          );
          return;
        }
        setSearch(json.search);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unknown load error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  /* ── Patch the status (FOUND / CANCELLED) ──────────────────────────── */
  const setStatus = useCallback(
    async (
      status: "FOUND" | "CANCELLED",
    ): Promise<SearchDto | null> => {
      if (!search || patching) return null;
      setPatching(true);
      setPatchError(null);
      try {
        const res = await fetch(
          `/api/searches/${encodeURIComponent(search.searchId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ status }),
          },
        );
        const json = (await res.json().catch(() => null)) as
          | SearchApiResponse
          | null;
        if (!res.ok || !json?.ok || !json.search) {
          setPatchError(
            json?.message ?? `Could not update search (HTTP ${res.status}).`,
          );
          return null;
        }
        setSearch(json.search);
        return json.search;
      } catch (err) {
        setPatchError(
          err instanceof Error ? err.message : "Unknown update error",
        );
        return null;
      } finally {
        setPatching(false);
      }
    },
    [search, patching],
  );

  return { search, loadError, patchError, patching, setStatus };
}
