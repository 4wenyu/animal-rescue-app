"use client";

import { type ReactNode, useEffect, useState } from "react";
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
import { ArrowLeft, PawPrint, Shield, Heart } from "lucide-react";

// ── Synchronous i18n: import every locale dictionary statically so the
//    first paint renders the right language without a flash. ──────────────
import enDict from "../../../../locales/en.json";
import esDict from "../../../../locales/es.json";
import zhCNDict from "../../../../locales/zh-CN.json";
import zhTWDict from "../../../../locales/zh-TW.json";
import jaDict from "../../../../locales/ja.json";
import koDict from "../../../../locales/ko.json";
import zhLegacyDict from "../../../../locales/zh.json";

const LOCALE_DICTS: Record<string, Record<string, unknown>> = {
  en: enDict as unknown as Record<string, unknown>,
  es: esDict as unknown as Record<string, unknown>,
  "zh-CN": zhCNDict as unknown as Record<string, unknown>,
  "zh-TW": zhTWDict as unknown as Record<string, unknown>,
  ja: jaDict as unknown as Record<string, unknown>,
  ko: koDict as unknown as Record<string, unknown>,
  zh: zhLegacyDict as unknown as Record<string, unknown>,
};

const STORAGE_KEY = "rescuehub_locale";

function resolveLocale(stored: string | null): string {
  if (stored === "zh") return "zh-CN"; // legacy alias
  if (
    stored === "en" || stored === "es" || stored === "zh-CN" ||
    stored === "zh-TW" || stored === "ja" || stored === "ko"
  ) return stored;
  return "en";
}

// SSR-safe fallbacks (English) so the page is meaningful before hydration.
const EN_FALLBACK: Record<string, string> = {
  "public_intake.title": "Public Surrender Portal",
  "public_intake.intro":
    "This ESIGN/UETA-compliant electronic waiver creates a legally defensible chain of custody. Please select the option that applies to your situation.",
  "public_intake.found_stray_label": "🐾  I found a stray animal",
  "public_intake.found_stray_desc":
    "You found an animal that appears to be lost, abandoned, or injured.",
  "public_intake.owner_surrender_label": "📝  I need to surrender my pet",
  "public_intake.owner_surrender_desc":
    "You are the legal owner and wish to transfer custody to RescueHub.",
  "public_intake.waiver_title": "Electronic Waiver",
  "public_intake.waiver_intro":
    "Review and sign the ESIGN/UETA-compliant liability waiver. Your typed legal name constitutes an electronic signature under federal law.",
  "public_intake.cancel_prefix": "Cancel —",
  "public_intake.confirm_title": "Submission Complete",
  "public_intake.confirm_body":
    "Your surrender request has been recorded. The ESIGN waiver hash below serves as your verifiable electronic receipt.",
  "public_intake.hash_label": "ESIGN Waiver Record",
  "public_intake.hash_description":
    "SHA-256 hash of your typed-name signature and consent transaction. Keep this for your records.",
  "nav.back_to_options": "Back to Intake Options",
};

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

function tr(locale: string, key: string, vars?: Record<string, string | number>): string {
  const dict = LOCALE_DICTS[locale] ?? LOCALE_DICTS["en"];
  const parts = key.split(".");
  let value: unknown = dict;
  for (const p of parts) {
    if (typeof value !== "object" || value === null) return EN_FALLBACK[key] ?? key;
    value = (value as Record<string, unknown>)[p];
  }
  if (typeof value !== "string") return EN_FALLBACK[key] ?? key;
  if (!vars) return value;
  return Object.entries(vars).reduce((str, [k, v]) =>
    str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)), value);
}

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
  const [locale, setLocale] = useState<string>("en");
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);
  const [tokensAwarded, setTokensAwarded] = useState<number | null>(null);
  const [animalKind, setAnimalKind] = useState<SpeciesBreedValue>({
    species: null,
    breed: null,
  });

  // Resolve locale after hydration (server always renders English first).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
    } catch {
      // default to English
    }
  }, []);

  // Re-render when locale changes anywhere else in the app.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        setLocale(resolveLocale(localStorage.getItem(STORAGE_KEY)));
      } catch {
        // noop
      }
    };
    window.addEventListener("rescuehub-locale-change", handler as EventListener);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("rescuehub-locale-change", handler as EventListener);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const t = (key: string, vars?: Record<string, string | number>) =>
    tr(locale, key, vars);

  const handleTypeSelected = (type: SurrenderType): void => {
    setSurrenderType(type);
    setStep("esign");
  };

  const handleEsignComplete = async (hash: string): Promise<void> => {
    setEsignHash(hash);
    if (surrenderType) {
      // Telegram notification runs in parallel; do not await so the user
      // sees their confirmation immediately.
      void notifyTelegram(surrenderType, hash);
    }

    // Submit intake to /api/animals/intake. This is what creates the
    // Animal + IntakeRecord + mints the +50 onboarding bonus. The route
    // is idempotent for retries via the caller's idempotencyKey contract.
    setIsSubmittingIntake(true);
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
      if (res.ok) {
        const json = (await res.json()) as {
          tokensAwarded?: number;
        };
        setTokensAwarded(json.tokensAwarded ?? 0);
      } else {
        // Visible on the page so a failed submit isn't silent.
        console.warn("[intake/public] intake POST non-ok", res.status);
      }
    } catch (err) {
      console.warn("[intake/public] intake POST failed", err);
    } finally {
      setIsSubmittingIntake(false);
      setStep("confirm");
    }
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
            {t("nav.back_to_options")}
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
                  {t("public_intake.title")}
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {t("public_intake.intro")}
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
                    {t(labelKey)}
                  </span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {t(descKey)}
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
                {t("nav.back_to_options")}
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
                  {t("public_intake.waiver_title")}
                </h1>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {t("public_intake.waiver_intro")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ESIGNLiabilityWaiver
                surrenderType={surrenderType!}
                locale={locale}
                onSigned={handleEsignComplete}
              />
            </div>

            <div className="mt-6">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("public_intake.cancel_prefix")} {t("nav.back_to_options")}
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
                  {t("public_intake.confirm_title")}
                </h1>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-700">
                {t("public_intake.confirm_body")}
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
              {isSubmittingIntake && (
                <p className="mt-2 text-xs text-amber-700">
                  Submitting intake…
                </p>
              )}
            </div>

            {/* Hash display */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                {t("public_intake.hash_label")}
              </p>
              <p className="mt-2 text-xs font-mono text-slate-600 break-all">
                {esignHash}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {t("public_intake.hash_description")}
              </p>
            </div>

            {/* Back to intake options */}
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 active:scale-[0.97]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("nav.back_to_options")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}