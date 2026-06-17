"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Legal-notice banner shown above the citizen-facing /intake/public flow.
 * Suppressed on staff-only routes (e.g. /intake/document-scan) where the
 * ESIGN/UETA disclaimer would be misleading — those workflows handle their
 * own internal legal controls.
 */
export function IntakeLegalBanner(): ReactNode | null {
  const pathname = usePathname();
  // Hide when the current route is a staff-only intake workflow.
  // Extend this list as new staff routes are added.
  const STAFF_INTAKE_PATHS = ["/intake/document-scan"];

  if (STAFF_INTAKE_PATHS.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
      <strong>&#x26A0;&#xFE0F; Legal Notice:</strong> By proceeding, you consent
      to conduct electronic business in accordance with ESIGN / UETA. All
      signature records are cryptographically hashed and stored immutably.
    </div>
  );
}

export default IntakeLegalBanner;
