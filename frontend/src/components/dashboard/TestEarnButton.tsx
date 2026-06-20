/**
 * TestEarnButton (dev-only)
 * =========================
 * Temporary dev affordance for verifying the Epic 2 token ledger works
 * end-to-end. Clicking it POSTs to /api/tokens/transaction with an
 * ONBOARDING_BONUS_EARN of 50 tokens, then refreshes the wallet card.
 *
 * Stays visible only when NODE_ENV !== "production" so it can never be
 * surfaced to a real adopter. Delete this file before Epic 3 release.
 *
 * Drop in app/dashboard/page.tsx right below the <TokenWalletCardClient/>
 * section to verify writes:
 *
 *   import { TestEarnButton } from "@/src/components/dashboard/TestEarnButton";
 *   ...
 *   <TokenWalletCardClient />
 *   {process.env.NODE_ENV !== "production" && <TestEarnButton />}
 */

"use client";

import { useState } from "react";
import { Coins, Loader2, Check, AlertTriangle } from "lucide-react";

type Status = "idle" | "pending" | "success" | "error";

export function TestEarnButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleClick() {
    setStatus("pending");
    setMessage("");
    try {
      // The API derives userId from the session — never pass it ourselves.
      // uniqueness comes from Date.now() + a random suffix to defeat
      // double-click races.
      const idempotencyKey = `test-earn-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const res = await fetch("/api/tokens/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          direction: "EARN",
          actionType: "ONBOARDING_BONUS_EARN",
          amount: 50,
          idempotencyKey,
          notes: "Manual test-button award (dev only)",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // Surface Zod validation details if present so the user doesn't need
        // DevTools to debug a 400 in dev. In prod, drop the details.
        const details = Array.isArray(json?.details)
          ? json.details
              .map(
                (d: { path?: string; message?: string }) =>
                  `${d.path ?? "(root)"}: ${d.message ?? "invalid"}`,
              )
              .join("; ")
          : "";
        throw new Error(
          (json.message ?? json.error ?? `HTTP ${res.status}`) +
            (details && process.env.NODE_ENV !== "production"
              ? ` — ${details}`
              : ""),
        );
      }
      const newBal = json.wallet?.cachedBalance;
      setStatus("success");
      setMessage(`+50 tokens · new balance ${newBal?.toLocaleString() ?? "?"}`);
      // Tell the wallet card to refresh (the card listens for this event).
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("tokenwallet:refresh"));
      }, 50);
    } catch (err) {
      console.error("[TestEarnButton] failed", err);
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
          <Coins className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Dev Quick-Look: Test Earn Pipeline
          </p>
          <p className="text-xs text-amber-700">
            {status === "idle" &&
              "Awards +50 tokens (EARN / ONBOARDING_BONUS_EARN) via the API. Dev-only."}
            {status === "pending" && "Posting..."}
            {status === "success" && (
              <span className="font-mono">{message}</span>
            )}
            {status === "error" && (
              <span className="font-mono">Error: {message}</span>
            )}
          </p>
        </div>

        <button
          onClick={handleClick}
          disabled={status === "pending"}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-amber-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Test: award 50 tokens"
        >
          {status === "idle" && (
            <>
              <Coins className="h-4 w-4" />
              Earn +50 Tokens
            </>
          )}
          {status === "pending" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting...
            </>
          )}
          {status === "success" && (
            <>
              <Check className="h-4 w-4" />
              Awarded
            </>
          )}
          {status === "error" && (
            <>
              <AlertTriangle className="h-4 w-4" />
              Try Again
            </>
          )}
        </button>
      </div>
    </section>
  );
}
