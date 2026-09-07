import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { OutreachOptInForm } from "@/src/components/outreach/OutreachOptInForm";

export const dynamic = "force-dynamic";

/**
 * /outreach — the citizen "I can help" opt-in page for the autonomous
 * outreach agent (Tier 1.7).
 *
 * Server component (per CLAUDE.md: server > client). Reads the session to
 * decide whether to show the opt-in form (signed in) or a sign-in prompt.
 * The form itself is a thin client component that POSTs to /api/outreach/opt-in.
 */
export default async function OutreachPage(): Promise<ReactNode> {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          RescueHub · Autonomous Outreach
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          I can help
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          RescueHub&apos;s outreach agent matches people who can help with the
          animals that need them — donation, fostering, adoption, volunteering,
          sharing, or transport. This page is the explicit opt-in: without it,
          the agent never contacts anyone.
        </p>
      </div>

      {!session?.user?.id ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Sign in to opt in</h2>
          <p className="mt-2 text-sm text-slate-600">
            You need an account so we can attach your help preference and give
            you a one-click unsubscribe. Sign in or create one to continue.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : (
        <OutreachOptInForm />
      )}
    </div>
  );
}
