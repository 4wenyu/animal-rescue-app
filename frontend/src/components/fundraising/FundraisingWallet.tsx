"use client";

import { type ReactNode, useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string;
  amount: number;
  donorName: string;
  type: "medical" | "general";
  timestamp: string;
}

export interface FundraisingWalletProps {
  animalId: string;
  targetGoal: number;
  currentBalance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let txCounter = 0;
function nextTxId(): string {
  txCounter += 1;
  return `tx-${Date.now()}-${txCounter}`;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents);
}

/** Pseudo-random donor names for simulation. */
const DONOR_NAMES = [
  "Alice M.",
  "Bob K.",
  "Carol S.",
  "David L.",
  "Elena R.",
  "Frank T.",
  "Grace W.",
  "Henry P.",
  "Iris N.",
  "James D.",
];

function randomDonor(): string {
  return DONOR_NAMES[Math.floor(Math.random() * DONOR_NAMES.length)]!;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FundraisingWallet({
  animalId,
  targetGoal,
  currentBalance: initialBalance,
}: FundraisingWalletProps): ReactNode {
  // ── State ───────────────────────────────────────────────────────────
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [donationAmount, setDonationAmount] = useState("");
  const [allocation, setAllocation] = useState<"medical" | "general">(
    "general",
  );
  const [submitting, setSubmitting] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────
  const progressPct = useMemo(() => {
    if (targetGoal <= 0) return 0;
    return Math.min((balance / targetGoal) * 100, 100);
  }, [balance, targetGoal]);

  const isGoalReached = balance >= targetGoal;

  // ── Submit donation ─────────────────────────────────────────────────
  const handleDonate = useCallback(() => {
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSubmitting(true);

    // Simulate network latency
    setTimeout(() => {
      const tx: Transaction = {
        id: nextTxId(),
        amount,
        donorName: randomDonor(),
        type: allocation,
        timestamp: new Date().toISOString(),
      };

      setTransactions((prev) => [tx, ...prev]);
      setBalance((prev) => prev + amount);
      setDonationAmount("");
      setSubmitting(false);
    }, 400);
  }, [donationAmount, allocation]);

  // ── Transaction count per type ──────────────────────────────────────
  const medicalTotal = useMemo(
    () => transactions.filter((t) => t.type === "medical").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const generalTotal = useMemo(
    () => transactions.filter((t) => t.type === "general").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Fundraising Campaign
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Animal ID: <strong>{animalId}</strong>
        </p>
      </div>

      {/* ── Progress card ────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700">
            {formatCurrency(balance)} raised
          </span>
          <span className="text-xs text-neutral-400">
            of {formatCurrency(targetGoal)} goal
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isGoalReached ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
          <span>{Math.round(progressPct)}% funded</span>
          {isGoalReached && (
            <span className="font-semibold text-green-600">
              &#x2713; Goal reached &mdash; restriction will auto-switch to
              prevent fund mixing
            </span>
          )}
        </div>

        {/* Allocation breakdown */}
        {transactions.length > 0 && (
          <div className="mt-4 flex gap-6 border-t pt-3 text-xs text-neutral-500">
            <span>
              Medical: <strong className="text-neutral-700">{formatCurrency(medicalTotal)}</strong>
            </span>
            <span>
              General: <strong className="text-neutral-700">{formatCurrency(generalTotal)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Donation form ────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">
          Submit Donation
        </h2>

        <div className="mb-3">
          <label
            htmlFor="donation-amount"
            className="mb-1 block text-xs font-medium text-neutral-600"
          >
            Amount ($)
          </label>
          <input
            id="donation-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="e.g. 25.00"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Allocation radio toggles */}
        <fieldset className="mb-4">
          <legend className="mb-1.5 text-xs font-medium text-neutral-600">
            Fund Allocation
          </legend>
          <div className="flex gap-4">
            {[
              { value: "general" as const, label: "General Care (shelter ops)" },
              { value: "medical" as const, label: "Medical (direct treatment)" },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-xs transition ${
                  allocation === value
                    ? "border-blue-300 bg-blue-50 text-blue-800"
                    : "border-neutral-100 bg-neutral-50 text-neutral-600 hover:border-blue-200"
                }`}
              >
                <input
                  type="radio"
                  name="allocation"
                  value={value}
                  checked={allocation === value}
                  onChange={() => setAllocation(value)}
                  className="h-3.5 w-3.5 text-blue-600 focus:ring-blue-500"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Restriction warning when goal is met */}
        {isGoalReached && (
          <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            &#x26A0;&#xFE0F; Target reached. New donations will switch the
            restriction flag to prevent legally restricted fund mixing, in
            accordance with donor intent tracking.
          </div>
        )}

        <button
          type="button"
          onClick={handleDonate}
          disabled={submitting || !donationAmount || parseFloat(donationAmount) <= 0}
          className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {submitting ? "Processing..." : "Submit Donation"}
        </button>
      </div>

      {/* ── Transaction ledger ───────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">
          Transaction Ledger
          {transactions.length > 0 && (
            <span className="ml-2 font-normal text-neutral-400">
              ({transactions.length} entries)
            </span>
          )}
        </h2>

        {transactions.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">
            No donations yet. Submit a donation above to seed the ledger.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      tx.type === "medical" ? "bg-red-400" : "bg-blue-400"
                    }`}
                  />
                  <span className="font-medium text-neutral-700">
                    {tx.donorName}
                  </span>
                  <span className="text-neutral-400">
                    {new Date(tx.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 capitalize">
                    {tx.type}
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}