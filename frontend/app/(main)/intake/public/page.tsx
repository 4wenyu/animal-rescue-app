"use client";

import { type ReactNode, useState } from "react";
import {
  ESIGNLiabilityWaiver,
  type SurrenderType,
} from "@/src/components/intake/ESIGNLiabilityWaiver";

const SURRENDER_TYPES: { value: SurrenderType; label: string }[] = [
  { value: "FOUND_STRAY", label: "🐾  I found a stray animal" },
  { value: "OWNER_SURRENDER", label: "📝  I need to surrender my pet" },
];

/** Fire a Telegram notification for a public intake. */
async function notifyTelegram(
  surrenderType: SurrenderType,
  esignHash: string,
): Promise<void> {
  try {
    await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeType:
          surrenderType === "OWNER_SURRENDER"
            ? "OWNER_SURRENDER"
            : "PUBLIC_STRAY",
        details: {
          surrenderType,
          esignHash,
        },
      }),
    });
  } catch {
    // Fire-and-forget — notification failure must never block the user.
  }
}

/**
 * Public / Citizen intake page.
 *
 * Presents a two-step workflow:
 * 1. Select surrender type (Found Stray or Owner Surrender)
 * 2. Complete the ESIGN/UETA-compliant waiver
 */
export default function PublicIntakePage(): ReactNode {
  const [surrenderType, setSurrenderType] = useState<SurrenderType | null>(
    null,
  );
  const [esignHash, setEsignHash] = useState<string | null>(null);

  // ── Handle ESIGN signing ─────────────────────────────────────────────
  const handleSigned = (hash: string) => {
    setEsignHash(hash);
    // Fire Telegram notification in the background
    if (surrenderType) {
      notifyTelegram(surrenderType, hash);
    }
  };

  // ── If the waiver has been signed, show the confirmation ────────────
  if (esignHash) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
        <div className="text-3xl">&#x2705;</div>
        <h2 className="text-lg font-semibold text-green-800">
          Waiver Executed Successfully
        </h2>
        <p className="text-sm text-green-700">
          Your electronic signature has been recorded. The cryptographic
          fingerprint of your waiver is:
        </p>
        <code className="inline-block max-w-full truncate rounded bg-green-100 px-3 py-2 font-mono text-xs text-green-900">
          {esignHash}
        </code>
        <p className="text-xs text-green-600">
          This hash links your signature inextricably to this record. An
          immutable PDF snapshot will be stored for legal reference.
        </p>
        <button
          type="button"
          onClick={() => {
            setSurrenderType(null);
            setEsignHash(null);
          }}
          className="mt-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Submit Another Intake
        </button>
      </div>
    );
  }

  // ── Step 1: Select surrender type ────────────────────────────────────
  if (!surrenderType) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Animal Intake Portal
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Please select the category that best describes your situation.
          </p>
        </div>

        <div className="grid gap-4">
          {SURRENDER_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSurrenderType(value)}
              className="flex items-center gap-3 rounded border border-neutral-200 bg-white px-5 py-4 text-left text-sm transition hover:border-blue-300 hover:shadow-sm"
            >
              <span className="text-base">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-400">
          By continuing you will be asked to provide your electronic consent
          and signature under ESIGN / UETA.
        </p>
      </div>
    );
  }

  // ── Step 2: ESIGN waiver ─────────────────────────────────────────────
  return (
    <ESIGNLiabilityWaiver
      surrenderType={surrenderType}
      onSigned={handleSigned}
    />
  );
}