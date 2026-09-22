import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { getIntegrationStatus } from "@/lib/ops/integrationStatus";

export const dynamic = "force-dynamic";

function Row({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          ok
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        {ok ? "Ready" : "Needs setup"}
      </span>
    </li>
  );
}

export default async function StaffOpsPage(): Promise<ReactNode> {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;

  if (!session?.user?.id || (role !== "STAFF" && role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Staff only</h1>
        <p className="mt-2 text-sm text-slate-600">
          Integration status is limited to STAFF/ADMIN.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const s = getIntegrationStatus();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Operator status</h1>
        <p className="mt-2 text-sm text-slate-600">
          Env presence only — no secrets shown. Checklist:{" "}
          <code className="text-xs">docs/OPERATOR_CHECKLIST.md</code>
        </p>
      </div>
      <ul className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
        <Row
          label="Site mode"
          ok={s.siteMode === "live"}
          detail={
            s.siteMode === "live"
              ? "NEXT_PUBLIC_SITE_MODE=live"
              : "Preview mode — pledges labeled, noindex"
          }
        />
        <Row
          label="LLM chat"
          ok={s.llmConfigured}
          detail="TEAMOROUTER / FREELLMAPI / Gemini key"
        />
        <Row
          label="Google citizen login"
          ok={s.googleAuthConfigured}
          detail="AUTH_SECRET + AUTH_GOOGLE_* + NEXT_PUBLIC_AUTH_GOOGLE_ENABLED"
        />
        <Row
          label="Helper SMS (Twilio)"
          ok={s.smsConfigured}
          detail={
            s.smsConfigured
              ? "Staff-approved texts to opted-in phones"
              : "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER"
          }
        />
        <Row
          label="Telegram ops channel"
          ok={s.telegramConfigured}
          detail={
            s.telegramConfigured
              ? "Intake + outreach delivery enabled"
              : "Record-only outreach until TELEGRAM_* set"
          }
        />
        <Row
          label="Stripe checkout"
          ok={s.stripeConfigured}
          detail="STRIPE_SECRET_KEY"
        />
        <Row
          label="Stripe webhooks"
          ok={s.stripeWebhookConfigured}
          detail="STRIPE_WEBHOOK_SECRET + Dashboard endpoint"
        />
        <Row
          label="Rate limits"
          ok={s.rateLimitBackend === "redis"}
          detail={
            s.rateLimitBackend === "redis"
              ? "Upstash Redis (multi-instance safe)"
              : "In-memory only — set UPSTASH_REDIS_REST_* before multi-instance"
          }
        />
        <Row
          label="Sentry"
          ok={s.sentryConfigured}
          detail="SENTRY_DSN for unhandled errors"
        />
        <Row
          label="Shelter hours copy"
          ok={s.shelterHoursConfigured}
          detail="NEXT_PUBLIC_SHELTER_HOURS (public hours string)"
        />
        <Row
          label="Real animal photos"
          ok={!s.placeholderPhotos}
          detail="Replace placedog.net seed images with shelter photos"
        />
      </ul>
      <p className="text-xs text-slate-500">
        Also rotate any LLM key that ever sat in chat, and change seeded
        passwords before sharing a preview URL.
      </p>
    </div>
  );
}
