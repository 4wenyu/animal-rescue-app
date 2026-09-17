"use client";

/**
 * useShareGrant — claim-state machine for the free-search milestone grant.
 *
 * The server-side claim is idempotent; an already-granted search resolves
 * to the "already" state with the resulting balance.
 */

import { useCallback, useState } from "react";

import { trWithFallback } from "./i18nFallback";
import type { GrantState } from "./shareTypes";
import type { TrFn } from "./types";

interface GrantResponse {
  ok?: boolean;
  granted?: boolean;
  alreadyGranted?: boolean;
  balanceAfter?: number;
  message?: string;
}

export function useShareGrant(searchId: string, tr: TrFn) {
  const [grant, setGrant] = useState<GrantState>({ status: "idle" });

  const claim = useCallback(async () => {
    if (grant.status === "claiming") return;
    setGrant({ status: "claiming" });
    try {
      const res = await fetch("/api/shares/milestone-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ searchId }),
      });
      const json = (await res.json().catch(() => null)) as
        | GrantResponse
        | null;
      if (!res.ok || !json?.ok) {
        setGrant({
          status: "error",
          message:
            json?.message ?? trWithFallback(tr, "radar.share_error_claim"),
        });
        return;
      }
      if (json.alreadyGranted) {
        setGrant({ status: "already", balanceAfter: json.balanceAfter });
      } else if (json.granted) {
        setGrant({ status: "claimed", balanceAfter: json.balanceAfter });
      } else {
        setGrant({
          status: "error",
          message: trWithFallback(tr, "radar.share_error_milestone"),
        });
      }
    } catch (err) {
      setGrant({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : trWithFallback(tr, "radar.share_error_claim_generic"),
      });
    }
  }, [grant.status, searchId, tr]);

  return { grant, claim };
}
