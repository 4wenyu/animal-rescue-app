"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import {
  ESIGNLiabilityWaiver,
  type SurrenderType,
} from "@/src/components/intake/ESIGNLiabilityWaiver";
import { ArrowLeft, PawPrint, Shield, Heart } from "lucide-react";

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
 * - Step 1: Select surrender type (found stray / owner surrender).
 * - Step 2: ESIGN/UETA-compliant liability waiver with signed-name + SHA-256.
 * - Step 3: Confirmation with hash display.
 *
 * This is a strict legal workflow. Every consent action creates a verifiable
 * record. The ESIGN waiver renders at step 2 regardless of surrender type.
 */
export default function PublicIntakePage(): ReactNode {
  const [step, setStep] = useState<"select" | "esign" | "confirm">("select");
  const [surrenderType, setSurrenderType] = useState<SurrenderType | null>(null);
  const [esignHash, setEsignHash] = useState<string | null>(null);

  const handleTypeSelected = (type: SurrenderType): void => {
    setSurrenderType(type);
    setStep("esign");
  };

  const handleEsignComplete = (hash: string): void => {
    setEsignHash(hash);
    if (surrenderType) {
      notifyTelegram(surrenderType, hash);
    }
    setStep("confirm");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Premium Header ──────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition">
            <PawPrint className="h-4 w-4" />
            <span>RescueHub</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* ── Step Indicator ────────────────────────────────── */}
        <div className="mb-10 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step === "select"
                ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                : "bg-emerald-500 text-white"
            }`}
          >
            1
          </div>
          <div className={`h-px flex-1 ${step !== "select" ? "bg-emerald-300" : "bg-slate-200"}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step === "esign"
                ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200"
                : step === "confirm"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            2
          </div>
          <div className={`h-px flex-1 ${step === "confirm" ? "bg-emerald-300" : "bg-slate-200"}`} />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              step === "confirm"
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            3
          </div>
        </div>

        {/* ── Step 1: Surrender Type ────────────────────────── */}
        {step === "select" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-500" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Public Surrender Portal
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                This ESIGN/UETA-compliant electronic waiver creates a legally
                defensible chain of custody. Please select the option that
                applies to your situation.
              </p>
            </div>

            {/* Premium surrender type cards */}
            <div className="grid gap-4">
              {SURRENDER_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleTypeSelected(value)}
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <span className="text-base font-semibold text-slate-900 group-hover:text-emerald-700">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {value === "FOUND_STRAY"
                      ? "You found an animal that appears to be lost, abandoned, or injured."
                      : "You are the legal owner and wish to transfer custody to RescueHub."}
                  </span>
                </button>
              ))}
            </div>

            {/* Back button */}
            <div className="pt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 2: ESIGN Waiver ──────────────────────────── */}
        {step === "esign" && (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Electronic Waiver
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Review and sign the ESIGN/UETA-compliant liability waiver.
                Your typed legal name constitutes an electronic signature
                under federal law.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ESIGNLiabilityWaiver onComplete={handleEsignComplete} />
            </div>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel — Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirmation ──────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-600" />
                <h1 className="text-xl font-bold tracking-tight text-emerald-900">
                  Submission Complete
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                Your surrender request has been recorded. The ESIGN waiver
                hash below serves as your verifiable electronic receipt.
              </p>
            </div>

            {/* Hash display */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                ESIGN Waiver Record
              </p>
              <p className="mt-2 text-xs font-mono text-slate-600 break-all">
                {esignHash}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                SHA-256 hash of your typed-name signature and consent
                transaction. Keep this for your records.
              </p>
            </div>

            {/* Back to dashboard */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}