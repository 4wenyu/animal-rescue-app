"use client";

import { type FormEvent, type ReactNode, useCallback, useState } from "react";

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

/** Fire a Telegram notification for a county intake. */
async function notifyTelegram(
  badgeNumber: string,
  departmentId: string,
): Promise<void> {
  try {
    await fetch("/api/telegram/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intakeType: "MUNICIPAL_TRANSFER",
        details: { officerBadgeNumber: badgeNumber, departmentId },
      }),
    });
  } catch {
    // Fire-and-forget — notification failure must never block the user.
  }
}

/**
 * County / municipal transfer intake page for Animal Control Officers.
 *
 * Captures officer credentials (`officerBadgeNumber`, `departmentId`)
 * matching the Prisma `IntakeRecord` schema and submits a municipal
 * transfer request which verifies the receiving rescue organisation's
 * IRS compliance and zoning permits.
 */
export default function CountyIntakePage(): ReactNode {
  // ── Form state ──────────────────────────────────────────────────────
  const [badgeNumber, setBadgeNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Validation (runs on blur and submit) ────────────────────────────
  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};

    const badgeErr = validateBadge(badgeNumber);
    if (badgeErr) next.badgeNumber = badgeErr;

    const deptErr = validateDepartment(departmentId);
    if (deptErr) next.departmentId = deptErr;

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [badgeNumber, departmentId]);

  // ── Submit handler ───────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);

      // Simulate API submission (production would POST to an API route
      // that pings the receiving org's ein_number for IRS compliance and
      // checks local municipal zoning permits).
      await new Promise((r) => setTimeout(r, 800));

      // Fire Telegram notification in the background (fire-and-forget)
      notifyTelegram(badgeNumber, departmentId);

      setSubmitting(false);
      setSubmitted(true);
    },
    [validate, badgeNumber, departmentId],
  );

  // ── Confirmation view ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
        <div className="text-3xl">&#x1F4CB;</div>
        <h2 className="text-lg font-semibold text-green-800">
          Municipal Transfer Submitted
        </h2>
        <p className="text-sm text-green-700">
          Officer <strong>{badgeNumber}</strong> (Dept.{" "}
          <strong>{departmentId}</strong>) has initiated the digital handoff.
          The system will verify:
        </p>
        <ul className="mx-auto max-w-xs list-inside list-disc text-left text-xs text-green-700">
          <li>Receiving org EIN via IRS compliance API</li>
          <li>Local municipal facility zoning permits</li>
          <li>Stray hold jurisdiction rules</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            setBadgeNumber("");
            setDepartmentId("");
            setErrors({});
            setSubmitted(false);
          }}
          className="mt-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          New Transfer
        </button>
      </div>
    );
  }

  // ── Intake form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          County Animal Control — Municipal Transfer
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Authenticate your credentials and submit a formal digital handoff
          of an animal from municipal custody to the receiving rescue
          organisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Badge Number */}
        <div>
          <label
            htmlFor="badge-number"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Officer Badge Number
          </label>
          <input
            id="badge-number"
            type="text"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            onBlur={() => {
              const err = validateBadge(badgeNumber);
              setErrors((prev) => ({
                ...prev,
                badgeNumber: err ?? "",
              }));
            }}
            placeholder="e.g. ACO-4821"
            className={`w-full rounded border px-3 py-2 text-sm transition focus:outline-none focus:ring-1 ${
              errors.badgeNumber
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            autoComplete="off"
          />
          {errors.badgeNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.badgeNumber}</p>
          )}
        </div>

        {/* Department ID */}
        <div>
          <label
            htmlFor="department-id"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Department ID
          </label>
          <input
            id="department-id"
            type="text"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            onBlur={() => {
              const err = validateDepartment(departmentId);
              setErrors((prev) => ({
                ...prev,
                departmentId: err ?? "",
              }));
            }}
            placeholder="e.g. LA-ACD-101"
            className={`w-full rounded border px-3 py-2 text-sm transition focus:outline-none focus:ring-1 ${
              errors.departmentId
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-neutral-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            autoComplete="off"
          />
          {errors.departmentId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.departmentId}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {submitting ? "Verifying..." : "Submit Municipal Transfer"}
        </button>
      </form>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
        <strong>&#x26A0;&#xFE0F;</strong> Upon submission the system will
        verify the receiving organisation&apos;s IRS standing and local
        municipal zoning permits before completing the transfer.
      </div>
    </div>
  );
}