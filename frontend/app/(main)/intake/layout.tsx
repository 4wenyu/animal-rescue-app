import type { Metadata } from "next";
import { IntakeLegalBanner } from "@/src/components/intake/IntakeLegalBanner";

export const metadata: Metadata = {
  title: "Animal Intake — RescueHub",
  description:
    "Submit a stray found animal or surrender your pet with legally compliant electronic consent.",
};

/**
 * Public Intake layout shell.
 * Wraps the citizen-facing surrender / found-stray workflow with the
 * UETA/ESIGN compliance header (IntakeLegalBanner) and a minimal branded footer.
 * Staff-only subroutes (e.g. /intake/document-scan) opt out of the banner
 * via pathname check inside IntakeLegalBanner.
 */
export default function IntakeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <IntakeLegalBanner />

      {children}

      <footer className="border-t pt-4 text-center text-xs text-neutral-400">
        RescueHub &mdash; Animal Rescue Management Platform &middot; Intake
        Module v1.0
      </footer>
    </div>
  );
}