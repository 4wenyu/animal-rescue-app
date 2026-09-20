import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdoptProfileView from "./AdoptProfileView";
import { SiteFooter } from "@/src/components/home/SiteFooter";
import { SiteNav } from "@/src/components/home/SiteNav";
import { catalogDogs, getPublicRoster } from "@/lib/roster";

export function generateStaticParams() {
  return catalogDogs().map((d) => ({ id: String(d.id) }));
}

export const dynamicParams = true;

export default async function AdoptProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = (await getPublicRoster()).find((d) => d.id === Number(id));
  if (!animal) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteNav />
      <div className="mx-auto max-w-4xl px-4 pb-28 pt-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          RescueHub
        </Link>
        <AdoptProfileView
          animal={{
            ...animal,
            strayHoldExpiresAt: animal.strayHoldExpiresAt ?? animal.intakeTimestamp,
          }}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
