"use client";

import { type ReactNode, useRef, useState } from "react";
import Link from "next/link";
import {
  ESIGNLiabilityWaiver,
  type SurrenderType,
} from "@/src/components/intake/ESIGNLiabilityWaiver";
import {
  SpeciesBreedSelect,
  type SpeciesBreedValue,
} from "@/src/components/ui/SpeciesBreedSelect";
import { breedLabel } from "@/src/lib/animalTaxonomy";
import { ArrowLeft, PawPrint, Shield, Heart, Loader2, AlertCircle } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

/** Localized label for the optional animal-kind picker (kept inline to avoid
 *  touching 7 locale files for one heading). */
const ANIMAL_KIND_LABEL: Record<string, string> = {
  en: "What kind of animal is this? (optional)",
  es: "¿Qué tipo de animal es? (opcional)",
  "zh-CN": "这是什么动物？（选填）",
  "zh-TW": "這是什麼動物？（選填）",
  ja: "これはどんな動物ですか？（任意）",
  ko: "어떤 동물인가요? (선택 사항)",
};

/** Hardcoded surrender-type data — keys map to i18n via labelKey. */
const SURRENDER_TYPES: {
  value: SurrenderType;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: "FOUND_STRAY",
    labelKey: "public_intake.found_stray_label",
    descKey: "public_intake.found_stray_desc",
  },
  {
    value: "OWNER_SURRENDER",
    labelKey: "public_intake.owner_surrender_label",
    descKey: "public_intake.owner_surrender_desc",
  },
];

/** Fire a Telegram notification for a public intake that already persisted. */
async function notifyTelegram(
  surrenderType: SurrenderType,
  esignHash: string,
  animalId?: string,
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
          ...(animalId ? { animalId } : {}),
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
  const { locale, tr } = useI18n();
  const [step, setStep] = useState<"select" | "esign" | "confirm">("select");
  const [surrenderType, setSurrenderType] = useState<SurrenderType | null>(null);
  const [esignHash, setEsignHash] = useState<string | null>(null);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);
  const [tokensAwarded, setTokensAwarded] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /** Synchronous double-submit guard: state updates lag behind fast clicks. */
  const submittingRef = useRef(false);
  const [animalKind, setAnimalKind] = useState<SpeciesBreedValue>({
    species: null,
    breed: null,
  });

  const handleTypeSelected = (type: SurrenderType): void => {
    setSurrenderType(type);
    setStep("esign");
  };

  /**
   * POST the intake to /api/animals/intake. This is what creates the
   * Animal + IntakeRecord and mints the onboarding bonus, so the user only
   * advances to the confirmation step on a 2xx — a failed request leaves
   * them on the waiver step with a retryable error instead of a receipt
   * for something that was never recorded.
   */
  const submitIntake = async (hash: string): Promise<void> => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmittingIntake(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/animals/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-esign-hash": hash,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          // Tier 0.4: server derives stray-hold semantics from this type.
          // OWNER_SURRENDER → no stray hold; PUBLIC_STRAY → 72h hold computed.
          intakeType:
            surrenderType === "OWNER_SURRENDER"
              ? "OWNER_SURRENDER"
              : "PUBLIC_STRAY",
          animals: [
            {
              species: animalKind.species,
              breed:
                (animalKind.breed &&
                  breedLabel(animalKind.breed, locale)) ||
                "Mixed Breed",
              medicalStatus: "Healthy",
              euthanasia_risk_status: "SAFE",
              intakeTimestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!res.ok) {
        console.warn("[intake/public] intake POST non-ok", res.status);
        setSubmitError(tr("public_intake.submit_failed_body"));
        return;
      }

      const json = (await res.json()) as {
        tokensAwarded?: number;
        rewards?: { animals?: { animalId?: string }[] };
      };
      setTokensAwarded(json.tokensAwarded ?? 0);
      setStep("confirm");
      // Alert ops only after the Animal/IntakeRecord actually exists. Do
      // not await — a Telegram outage must not delay the citizen receipt.
      if (surrenderType) {
        void notifyTelegram(
          surrenderType,
          hash,
          json.rewards?.animals?.[0]?.animalId,
        );
      }
    } catch (err) {
      console.warn("[intake/public] intake POST failed", err);
      setSubmitError(tr("public_intake.submit_failed_body"));
    } finally {
      submittingRef.current = false;
      setIsSubmittingIntake(false);
    }
  };

  const handleEsignComplete = async (hash: string): Promise<void> => {
    setEsignHash(hash);
    await submitIntake(hash);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Premium Header ──────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr("nav.back_to_options")}
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
                  {tr("public_intake.title")}
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {tr("public_intake.intro")}
              </p>
            </div>

            {/* Premium surrender type cards */}
            <div className="grid gap-4">
              {SURRENDER_TYPES.map(({ value, labelKey, descKey }) => (
                <button
                  key={value}
                  onClick={() => handleTypeSelected(value)}
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <span className="text-base font-semibold text-slate-900 group-hover:text-emerald-700">
                    {tr(labelKey)}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {tr(descKey)}
                  </span>
                </button>
              ))}
            </div>

            {/* Optional animal-kind picker — feeds species/breed into intake */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-slate-700">
                {ANIMAL_KIND_LABEL[locale] ?? ANIMAL_KIND_LABEL.en}
              </p>
              <SpeciesBreedSelect
                value={animalKind}
                onChange={setAnimalKind}
              />
            </div>

            {/* Back button */}
            <div className="pt-4">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                {tr("nav.back_to_options")}
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
                  {tr("public_intake.waiver_title")}
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {tr("public_intake.waiver_intro")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ESIGNLiabilityWaiver
                surrenderType={surrenderType!}
                locale={locale}
                onSigned={handleEsignComplete}
              />
            </div>

            {isSubmittingIntake && (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {tr("public_intake.submitting")}
              </p>
            )}

            {submitError && !isSubmittingIntake && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h2 className="text-sm font-bold text-red-900">
                    {tr("public_intake.submit_failed_title")}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-red-700">
                  {submitError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (esignHash) void submitIntake(esignHash);
                  }}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  {tr("public_intake.retry")}
                </button>
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                {tr("public_intake.cancel_prefix")} {tr("nav.back_to_options")}
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
                  {tr("public_intake.confirm_title")}
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                {tr("public_intake.confirm_body")}
              </p>
              {tokensAwarded !== null && tokensAwarded > 0 && (
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900"
                  data-testid="intake-token-reward"
                >
                  <span className="text-base">🎁</span>
                  <span>
                    +{tokensAwarded} tokens minted to your wallet
                  </span>
                </div>
              )}
              {tokensAwarded === 0 && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                  Intake recorded — no token grant for anonymous submissions.
                </p>
              )}
            </div>

            {/* Hash display */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                {tr("public_intake.hash_label")}
              </p>
              <p className="mt-2 text-xs font-mono text-slate-600 break-all">
                {esignHash}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {tr("public_intake.hash_description")}
              </p>
            </div>

            {/* Back to intake options */}
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" />
              {tr("nav.back_to_options")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}