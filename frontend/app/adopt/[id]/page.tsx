import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import dogs from "../../../data/dogs.json";
import AdoptProfileView from "./AdoptProfileView";

// ── Static dog data (same source as home feed / hold-profile) ─
type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
};

export function generateStaticParams() {
  return (dogs as Dog[]).map((d) => ({ id: String(d.id) }));
}

// The adoption roster is a static catalog (dogs.json). Only the ids listed
// in generateStaticParams exist; any other id is a genuine 404. With
// dynamicParams = false, Next serves a real 404 status for unknown ids
// instead of an on-demand streamed soft-404 (200 + noindex).
export const dynamicParams = false;

export default async function AdoptProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dogsTyped = dogs as Dog[];
  const animal = dogsTyped.find((d) => d.id === Number(id));
  if (!animal) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to adoption listings
        </Link>
        <AdoptProfileView animal={animal} />
      </div>
    </div>
  );
}
