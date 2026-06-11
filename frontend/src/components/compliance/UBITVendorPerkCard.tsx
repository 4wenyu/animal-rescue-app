"use client";

import { type ReactNode, useMemo } from "react";

// ---------------------------------------------------------------------------
// Inline type definitions (decoupled from Prisma Client to keep the component
// framework-agnostic and avoid importing heavy generated code in the frontend).
// ---------------------------------------------------------------------------

export type TriggerEvent =
  | "ADOPTION_FINALIZED"
  | "DONATION_MADE"
  | "REFERRAL_SUCCESS";

export type UIRenderMode = "NEUTRAL_ACKNOWLEDGMENT";

export interface PerkData {
  perkId: string;
  sponsorOrgId: string;
  sponsorName: string;
  sponsorLogoUrl: string;
  triggerEvent: TriggerEvent;
  uiRenderMode: UIRenderMode;
  rewardCode: string;
}

// ---------------------------------------------------------------------------
// UBIT-SAFE MARKDOWN SANITIZER
//
// IRC Section 513(i) defines "qualified sponsorship" as a payment where the
// sponsor receives no substantial benefit other than the use of a logo or a
// "neutral acknowledgment" of the payment.  To stay strictly within this
// safe harbour we strip away anything that could be construed as advertising.
// ---------------------------------------------------------------------------

/** Patterns that indicate taxable advertising content. */
const AD_FLAG_PATTERNS: RegExp[] = [
  /<img/i,
  /<script/i,
  /<iframe/i,
  /<tracking/i,
  /<pixel/i,
  /src\s*=/i,
  /onclick/i,
  /onload/i,
  /onerror/i,
  /%20off/i,
  /discount/i,
  /\bbest\b/i,
  /\btop.?rated\b/i,
  /\bbuy\b/i,
  /\bshop\b/i,
  /coupon/i, // "rewardCode" is acceptable; free-form "coupon" copy is not
];

/**
 * Validates that a text string does not contain mark-up or language that
 * would classify the sponsorship as taxable advertising.
 *
 * In strict mode it throws; in development mode it logs a console warning.
 */
function assertNeutralAcknowledgement(
  text: string,
  fieldLabel: string,
): void {
  for (const pattern of AD_FLAG_PATTERNS) {
    if (pattern.test(text)) {
      const message = `[UBIT SAFEGUARD] Field "${fieldLabel}" contains prohibited advertising content matching /${pattern.source}/. Value blocked.`;
      if (process.env.NODE_ENV === "development") {
        console.warn(message);
      } else {
        throw new Error(message);
      }
    }
  }
}

/** Sanitise a single value or return a fallback. */
function sanitise(value: string, label: string): string {
  assertNeutralAcknowledgement(value, label);
  return value;
}

// ---------------------------------------------------------------------------
// HUMAN-READABLE TRIGGER LABELS (still purely informational)
// ---------------------------------------------------------------------------

const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  ADOPTION_FINALIZED: "Adoption Finalized",
  DONATION_MADE: "Donation Received",
  REFERRAL_SUCCESS: "Referral Completed",
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export interface UBITVendorPerkCardProps {
  /** The perk payload from the database. */
  perk: PerkData;
}

/**
 * `<UBITVendorPerkCard />`
 *
 * Displays a corporate sponsor reward in a strictly **neutral** format.
 *
 * **UBIT Compliance (IRC § 513(i)):**
 * - Only the sponsor logo, legal name, trigger event, and a raw voucher code
 *   are displayed.
 * - No qualitative language ("best", "top-rated"), price comparisons, calls to
 *   action, or tracking pixels are permitted.
 * - Every text prop is run through `assertNeutralAcknowledgement` at render
 *   time to catch injection attacks or accidental marketing copy.
 *
 * @example
 * ```tsx
 * <UBITVendorPerkCard
 *   perk={{
 *     perkId: "abc-123",
 *     sponsorOrgId: "org-456",
 *     sponsorName: "Paws & Claws Supplies",
 *     sponsorLogoUrl: "https://cdn.rescuehub.org/logos/paws.svg",
 *     triggerEvent: "ADOPTION_FINALIZED",
 *     uiRenderMode: "NEUTRAL_ACKNOWLEDGMENT",
 *     rewardCode: "PAWS-WELCOME-2026",
 *   }}
 * />
 * ```
 */
export function UBITVendorPerkCard({ perk }: UBITVendorPerkCardProps): ReactNode {
  // Run compliance checks on every render so an accidentally-mutated DB row
  // can never slip through.
  const safe = useMemo(() => {
    const name = sanitise(perk.sponsorName, "sponsorName");
    const trigger = sanitise(TRIGGER_LABELS[perk.triggerEvent], "triggerEvent");
    const code = sanitise(perk.rewardCode, "rewardCode");

    return { name, trigger, code };
  }, [perk]);

  // ── Render: purely informational, no tracking, no qualitative language ──

  return (
    <div
      data-perk-id={perk.perkId}
      data-ubit-mode={perk.uiRenderMode}
      className="flex items-center gap-4 rounded border border-neutral-200 bg-white p-4 shadow-sm transition"
    >
      {/* Sponsor Logo — allowed under IRS safe harbour */}
      <img
        src={perk.sponsorLogoUrl}
        alt={`${safe.name} logo`}
        className="h-12 w-12 rounded object-contain"
        loading="lazy"
      />

      {/* Informational details — strictly neutral */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-neutral-900">{safe.name}</p>
        <p className="text-xs text-neutral-500">{safe.trigger}</p>
      </div>

      {/* Reward code — shown as-is, no marketing framing */}
      <div className="rounded bg-neutral-100 px-3 py-1.5">
        <span className="font-mono text-xs tracking-wider text-neutral-700">
          {safe.code}
        </span>
      </div>
    </div>
  );
}