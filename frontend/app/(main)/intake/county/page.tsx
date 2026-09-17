"use client";

import { type FormEvent, type ReactNode, useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PawPrint, Shield, BadgeCheck } from "lucide-react";

/**
 * Officer Badge Number validation: must be alphanumeric, 4–20 characters.
 */
function validateBadge(value: string): string | null {
  if (!value.trim()) return "Officer badge number is required.";
  if (!/^[A-Za-z0-9]{4,20}$/.test(value.trim()))
    return "Badge number must be 4–20 alphanumeric characters.";
  return null;
}

/**
 * Department ID validation: must be alphanumeric with optional hyphens.
 */
function validateDepartment(value: string): string | null {
  if (!value.trim()) return "Department ID is required.";
  if (!/^[A-Za-z0-9\-]{2,30}$/.test(value.trim()))
    return "Department ID must be 2–30 characters (letters, digits, hyphens).";
  return null;
}

/**
 * Notify the shelter coordinator about a municipal transfer.
 * Returns false when the notification could not be delivered, so the caller
 * can tell the officer instead of claiming the handoff succeeded.
 */
async function notifyTelegram(
  badgeNumber: string,
  departmentId: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeType: "MUNICIPAL_TRANSFER",
        details: { officerBadgeNumber: badgeNumber, departmentId },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * County / municipal transfer intake page for Animal Control Officers.
 */
export default function CountyIntakePage(): ReactNode {
  const [badgeNumber, setBadgeNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    const badgeErr = validateBadge(badgeNumber);
    if (badgeErr) next.badgeNumber = badgeErr;
    const deptErr = validateDepartment(departmentId);
    if (deptErr) next.departmentId = deptErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [badgeNumber, departmentId]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (submitting) return;
      if (!validate()) return;

      setSubmitting(true);
      setSubmitError(null);

      // Honest flow: the only thing this does is notify the shelter
      // coordinator. No automated IRS / zoning verification happens here,
      // so a failed notification must not be reported as a completed handoff.
      const notified = await notifyTelegram(badgeNumber, departmentId);

      setSubmitting(false);
      if (!notified) {
        setSubmitError(
          "Could not reach the shelter notification service. Nothing was submitted — please try again.",
        );
        return;
      }
      setSubmitted(true);
    },
    [validate, badgeNumber, departmentId, submitting],
  );

  // ── Confirmation view ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center shadow-sm">
            <BadgeCheck className="mx-auto h-10 w-10 text-emerald-500" />
            <h2 className="mt-2 text-lg font-bold text-emerald-900">Transfer Notice Sent</h2>
            <p className="mt-2 text-sm text-emerald-700">
              Officer <strong>{badgeNumber}</strong> (Dept. <strong>{departmentId}</strong>) has requested a municipal transfer handoff.
            </p>
            <p className="mt-3 text-sm text-emerald-700">
              The shelter coordinator has been notified and will contact the receiving
              organisation to confirm the handoff.
            </p>
            <ul className="mx-auto mt-3 max-w-xs list-inside list-disc text-left text-xs text-emerald-700">
              <li>No automated IRS or zoning verification is performed</li>
              <li>Stray-hold jurisdiction rules apply once the animal is recorded</li>
            </ul>
            <button
              type="button"
              onClick={() => { setBadgeNumber(""); setDepartmentId(""); setErrors({}); setSubmitted(false); }}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
            >
              New Transfer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Intake form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              County Animal Control — Municipal Transfer
            </h1>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Authenticate your credentials and submit a formal digital handoff
            of an animal from municipal custody to the receiving rescue
            organisation.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="badge-number" className="mb-1 block text-sm font-medium text-slate-700">
                Officer Badge Number
              </label>
              <input
                id="badge-number"
                type="text"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, badgeNumber: validateBadge(badgeNumber) ?? "" }))}
                placeholder="e.g. ACO-4821"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.badgeNumber
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                autoComplete="off"
                aria-invalid={errors.badgeNumber ? true : undefined}
                aria-describedby={errors.badgeNumber ? "badge-number-error" : undefined}
              />
              {errors.badgeNumber && (
                <p id="badge-number-error" className="mt-1 text-xs text-red-600">
                  {errors.badgeNumber}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="department-id" className="mb-1 block text-sm font-medium text-slate-700">
                Department ID
              </label>
              <input
                id="department-id"
                type="text"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, departmentId: validateDepartment(departmentId) ?? "" }))}
                placeholder="e.g. LA-ACD-101"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.departmentId
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                }`}
                autoComplete="off"
                aria-invalid={errors.departmentId ? true : undefined}
                aria-describedby={errors.departmentId ? "department-id-error" : undefined}
              />
              {errors.departmentId && (
                <p id="department-id-error" className="mt-1 text-xs text-red-600">
                  {errors.departmentId}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Sending notice..." : "Submit Municipal Transfer"}
            </button>

            {submitError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
              >
                {submitError}
              </p>
            )}
          </form>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            ⚠️ Submitting sends a notification to the shelter coordinator. It does not
            create an animal record and performs no compliance verification — the
            receiving shelter completes the transfer.
          </div>
        </div>
      </div>
    </div>
  );
}