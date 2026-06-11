import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Medical Records — RescueHub",
  description:
    "View and manage medical intake records for all animals in the shelter.",
};

/** Placeholder data — replace with Prisma query in production. */
const RECENT_ANIMALS = [
  { id: "DOG-A001", species: "Dog", intakeDate: "2026-06-08" },
  { id: "CAT-B042", species: "Cat", intakeDate: "2026-06-09" },
  { id: "DOG-C109", species: "Dog", intakeDate: "2026-06-10" },
];

export default function MedicalRecordsPage(): ReactNode {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Medical Records
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Select an animal to view or update its ASPCA/CART-aligned medical
          intake examination.
        </p>
      </div>

      <div className="space-y-2">
        {RECENT_ANIMALS.map((animal) => (
          <Link
            key={animal.id}
            href={`/medical/${animal.id}`}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-neutral-800">
                {animal.id}
              </span>
              <span className="text-neutral-400">{animal.species}</span>
            </div>
            <span className="text-xs text-neutral-400">
              Intake: {animal.intakeDate}
            </span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-neutral-400">
        Showing {RECENT_ANIMALS.length} recent intakes. A full list will be
        available once the database is connected.
      </p>
    </div>
  );
}