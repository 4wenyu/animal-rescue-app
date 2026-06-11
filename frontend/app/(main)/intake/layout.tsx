import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Animal Intake — RescueHub",
  description:
    "Submit a stray found animal or surrender your pet with legally compliant electronic consent.",
};

/**
 * Public Intake layout shell.
 * Wraps the citizen-facing surrender / found-stray workflow with the
 * UETA/ESIGN compliance header and a minimal branded footer.
 */
export default function IntakeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Compliance banner — always visible during the intake flow */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 shadow-sm">
        <strong>&#x26A0;&#xFE0F; Legal Notice:</strong> By proceeding, you
        consent to conduct electronic business in accordance with ESIGN /
        UETA. All signature records are cryptographically hashed and stored
        immutably.
      </div>

      {children}

      <footer className="border-t pt-4 text-center text-xs text-neutral-400">
        RescueHub &mdash; Animal Rescue Management Platform &middot; Intake
        Module v1.0
      </footer>
    </div>
  );
}